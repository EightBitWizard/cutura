import { eq } from "drizzle-orm";

import { type OrderStatus, canTransition } from "@cutura/core";

import { writeAudit } from "../audit";
import type { Database } from "../getDb";
import { orderItem, statusEvent } from "../schema";
import { recomputeOrderStatus } from "./rollup";
import { type Clock, InvalidTransitionError, ShippingBlockedError, nowIso, uuid } from "./types";

export interface TransitionInput {
  orderItemId: string;
  to: OrderStatus;
  actor: string;
  reason?: string;
}

export interface TransitionResult {
  from: OrderStatus;
  to: OrderStatus;
  orderStatus: OrderStatus;
}

/** Guarded status transition for one garment: validates, audits (status_event), rolls up. */
export async function transitionOrderItem(
  db: Database,
  input: TransitionInput,
  deps: Clock = {},
): Promise<TransitionResult> {
  const now = deps.now ?? nowIso;
  const id = deps.newId ?? uuid;
  const [item] = await db.select().from(orderItem).where(eq(orderItem.id, input.orderItemId));
  if (!item) throw new Error(`order item not found: ${input.orderItemId}`);
  const from = item.status as OrderStatus;
  if (!canTransition(from, input.to)) throw new InvalidTransitionError(from, input.to);

  await db.insert(statusEvent).values({
    id: id(),
    orderId: item.orderId,
    orderItemId: item.id,
    fromStatus: from,
    toStatus: input.to,
    reason: input.reason ?? null,
    actor: input.actor,
    createdAt: now(),
  });
  await db
    .update(orderItem)
    .set({ status: input.to, updatedAt: now() })
    .where(eq(orderItem.id, item.id));
  const orderStatus = await recomputeOrderStatus(db, item.orderId);
  return { from, to: input.to, orderStatus };
}

/** Approve a garment (in_review -> approved). The caller sends the supplier email after this commits. */
export function approveOrderItem(
  db: Database,
  orderItemId: string,
  actor: string,
  deps: Clock = {},
): Promise<TransitionResult> {
  return transitionOrderItem(db, { orderItemId, to: "approved", actor, reason: "approved" }, deps);
}

/**
 * Release shipping for a whole order (FR-852): every item must be qc_passed,
 * then all flip to shipped together. Throws ShippingBlockedError listing the
 * items that are not qc_passed.
 */
export async function shipOrder(
  db: Database,
  input: { orderId: string; actor: string },
  deps: Clock = {},
): Promise<void> {
  const items = await db.select().from(orderItem).where(eq(orderItem.orderId, input.orderId));
  const blocked = items.filter((i) => (i.status as OrderStatus) !== "qc_passed").map((i) => i.id);
  if (blocked.length > 0) throw new ShippingBlockedError(blocked);
  for (const item of items) {
    await transitionOrderItem(
      db,
      { orderItemId: item.id, to: "shipped", actor: input.actor },
      deps,
    );
  }
  await writeAudit(db, {
    actor: input.actor,
    action: "order.shipped",
    entityType: "order",
    entityId: input.orderId,
    detail: { items: items.length },
  });
}
