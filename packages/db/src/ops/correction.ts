import { eq } from "drizzle-orm";

import { writeAudit } from "../audit";
import type { Database } from "../getDb";
import { orderItem, productionPackage } from "../schema";

const nowIso = () => new Date().toISOString();

/**
 * Record an audited pre-release correction on an order item (FR-1060). The order
 * snapshot is immutable, so this does NOT change measurements; it appends a
 * timestamped, supplier-facing note to the production package and writes an audit
 * entry. Only allowed while the item is in_review (before approval/release).
 * Measurement changes go through the sanctioned remake path. Returns false if the
 * item has no package or is past review.
 */
export async function recordPreReleaseCorrection(
  db: Database,
  input: { orderItemId: string; note: string },
  actor: string,
  deps: { now?: () => string } = {},
): Promise<boolean> {
  const [item] = await db
    .select({ status: orderItem.status })
    .from(orderItem)
    .where(eq(orderItem.id, input.orderItemId));
  if (!item || item.status !== "in_review") return false;

  const [pkg] = await db
    .select()
    .from(productionPackage)
    .where(eq(productionPackage.orderItemId, input.orderItemId));
  if (!pkg) return false;

  const now = (deps.now ?? nowIso)();
  const stamped = `[${now}] ${actor}: ${input.note}`;
  const internalNotes = pkg.internalNotes ? `${pkg.internalNotes}\n${stamped}` : stamped;
  await db.update(productionPackage).set({ internalNotes }).where(eq(productionPackage.id, pkg.id));
  await writeAudit(db, {
    actor,
    action: "order.correction",
    entityType: "orderItem",
    entityId: input.orderItemId,
    detail: { note: input.note },
  });
  return true;
}
