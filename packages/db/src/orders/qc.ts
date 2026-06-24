import { eq } from "drizzle-orm";

import {
  type OrderStatus,
  type QcChecklistItem,
  evaluateQcChecklist,
  isQcOverrideAllowed,
} from "@cutura/core";

import { writeAudit } from "../audit";
import type { Database } from "../getDb";
import { orderItem, productionPackage, qcRecord, statusEvent } from "../schema";
import { recomputeOrderStatus } from "./rollup";
import { transitionOrderItem } from "./transitions";
import { type Clock, OverrideNotAllowedError, nowIso, uuid } from "./types";

export interface QcSubmission {
  productionPackageId: string;
  checklist: QcChecklistItem[];
  notes?: string;
  photoR2Keys?: string[];
  reviewedBy: string;
}

/**
 * Record a QC result and move the garment accordingly. A failed checklist is
 * persisted verbatim and routes the item to qc_failed - there is no path here
 * that writes qc_passed for a checklist containing a fail (FR-872). The only way
 * past a fail is applyQcOverride.
 */
export async function submitQc(
  db: Database,
  sub: QcSubmission,
  deps: Clock = {},
): Promise<{ overallResult: "pass" | "fail" | "pass_with_notes"; itemStatus: OrderStatus }> {
  const now = deps.now ?? nowIso;
  const id = deps.newId ?? uuid;
  const [pkg] = await db
    .select()
    .from(productionPackage)
    .where(eq(productionPackage.id, sub.productionPackageId));
  if (!pkg) throw new Error(`production package not found: ${sub.productionPackageId}`);

  const overallResult = evaluateQcChecklist(sub.checklist);
  await db.delete(qcRecord).where(eq(qcRecord.productionPackageId, sub.productionPackageId));
  await db.insert(qcRecord).values({
    id: id(),
    productionPackageId: sub.productionPackageId,
    checklist: sub.checklist,
    overallResult,
    notes: sub.notes ?? null,
    photoR2Keys: sub.photoR2Keys ?? null,
    reviewedBy: sub.reviewedBy,
    reviewedAt: now(),
    overrideReason: null,
    overrideBy: null,
    createdAt: now(),
    updatedAt: now(),
  });

  const to: OrderStatus = overallResult === "fail" ? "qc_failed" : "qc_passed";
  const result = await transitionOrderItem(
    db,
    { orderItemId: pkg.orderItemId, to, actor: sub.reviewedBy, reason: `qc:${overallResult}` },
    deps,
  );
  await writeAudit(db, {
    actor: sub.reviewedBy,
    action: "qc.submit",
    entityType: "orderItem",
    entityId: pkg.orderItemId,
    detail: { result: overallResult },
  });
  return { overallResult, itemStatus: result.to };
}

/**
 * The single sanctioned path past a QC fail: qc_failed -> qc_passed, allowed only
 * from qc_failed (isQcOverrideAllowed) and fully audited (FR-890/891). Bypasses
 * the normal transition guard by design.
 */
export async function applyQcOverride(
  db: Database,
  input: { orderItemId: string; overrideReason: string; overrideBy: string },
  deps: Clock = {},
): Promise<void> {
  const now = deps.now ?? nowIso;
  const id = deps.newId ?? uuid;
  const [item] = await db.select().from(orderItem).where(eq(orderItem.id, input.orderItemId));
  if (!item) throw new Error(`order item not found: ${input.orderItemId}`);
  if (!isQcOverrideAllowed(item.status as OrderStatus)) throw new OverrideNotAllowedError();

  const [pkg] = await db
    .select()
    .from(productionPackage)
    .where(eq(productionPackage.orderItemId, input.orderItemId));
  if (pkg) {
    await db
      .update(qcRecord)
      .set({ overrideReason: input.overrideReason, overrideBy: input.overrideBy, updatedAt: now() })
      .where(eq(qcRecord.productionPackageId, pkg.id));
  }
  await db.insert(statusEvent).values({
    id: id(),
    orderId: item.orderId,
    orderItemId: item.id,
    fromStatus: "qc_failed",
    toStatus: "qc_passed",
    reason: `qc_override: ${input.overrideReason}`,
    actor: input.overrideBy,
    createdAt: now(),
  });
  await db
    .update(orderItem)
    .set({ status: "qc_passed", updatedAt: now() })
    .where(eq(orderItem.id, item.id));
  await writeAudit(db, {
    actor: input.overrideBy,
    action: "qc.override",
    entityType: "orderItem",
    entityId: item.id,
    detail: { reason: input.overrideReason },
  });
  await recomputeOrderStatus(db, item.orderId);
}
