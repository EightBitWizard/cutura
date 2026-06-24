import { eq } from "drizzle-orm";

import type { OrderStatus } from "@cutura/core";

import type { Database } from "../getDb";
import { order, orderItem } from "../schema";

// Happy-path ordering; the order is "the slowest item" along this path.
const HAPPY: OrderStatus[] = [
  "new",
  "in_review",
  "approved",
  "in_production",
  "arrived_ch",
  "qc_passed",
  "shipped",
];

/**
 * Roll item statuses up to an order status (FR-851). Escalation/blocking states
 * dominate (problem > awaiting_customer_info > qc_failed); otherwise the order is
 * the least-advanced item on the happy path, so the order waits on its slowest
 * item and can only reach "shipped" when every item is qc_passed (then shipped).
 */
export function computeOrderRollup(statuses: OrderStatus[]): OrderStatus {
  if (statuses.length === 0) return "new";
  if (statuses.includes("problem")) return "problem";
  if (statuses.includes("awaiting_customer_info")) return "awaiting_customer_info";
  if (statuses.includes("qc_failed")) return "qc_failed";
  let minIdx = HAPPY.length - 1;
  for (const s of statuses) {
    const idx = HAPPY.indexOf(s);
    if (idx !== -1 && idx < minIdx) minIdx = idx;
  }
  return HAPPY[minIdx] ?? "new";
}

/** Recompute and persist the order's rolled-up status from its items. */
export async function recomputeOrderStatus(db: Database, orderId: string): Promise<OrderStatus> {
  const items = await db.select().from(orderItem).where(eq(orderItem.orderId, orderId));
  const rollup = computeOrderRollup(items.map((i) => i.status as OrderStatus));
  await db
    .update(order)
    .set({ status: rollup, updatedAt: new Date().toISOString() })
    .where(eq(order.id, orderId));
  return rollup;
}
