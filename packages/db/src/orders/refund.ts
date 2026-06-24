import { eq } from "drizzle-orm";

import type { RefundInput } from "@cutura/core";

import { writeAudit } from "../audit";
import type { Database } from "../getDb";
import { order } from "../schema";

/** Executes a Shopify refund; injected so the helper is env-free + testable. */
export type RefundExecutor = (
  input: RefundInput,
) => Promise<{ refundId: string; userErrors: Array<{ message: string }> }>;

export type RefundOutcome = "refunded" | "no_shopify_order" | "failed";

/**
 * Execute a money-back refund for an order via the injected Shopify refund function
 * (fit-guarantee fallback). The order's Shopify order id is the refund target; the
 * outcome (executed / failed / no-shopify-order) is always written to the audit log.
 * The amount/line items are governed by Shopify from the order; no amount is set
 * here, so this never over-refunds. Idempotency is keyed on the order id.
 */
export async function executeOrderRefund(
  db: Database,
  opts: { orderId: string; actor: string; reason: string; refund: RefundExecutor },
): Promise<{ status: RefundOutcome; refundId?: string }> {
  const [ord] = await db.select().from(order).where(eq(order.id, opts.orderId));
  if (!ord?.shopifyOrderId) {
    await writeAudit(db, {
      actor: opts.actor,
      action: "refund.skipped_no_shopify",
      entityType: "order",
      entityId: opts.orderId,
    });
    return { status: "no_shopify_order" };
  }

  const result = await opts.refund({
    orderId: ord.shopifyOrderId,
    reason: opts.reason,
    notify: true,
    idempotencyKey: `fit-refund-${opts.orderId}`,
  });

  if (result.userErrors.length > 0) {
    await writeAudit(db, {
      actor: opts.actor,
      action: "refund.failed",
      entityType: "order",
      entityId: opts.orderId,
      detail: { errors: result.userErrors },
    });
    return { status: "failed" };
  }

  await writeAudit(db, {
    actor: opts.actor,
    action: "refund.executed",
    entityType: "order",
    entityId: opts.orderId,
    detail: { refundId: result.refundId },
  });
  return { status: "refunded", refundId: result.refundId };
}
