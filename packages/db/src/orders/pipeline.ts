import { eq } from "drizzle-orm";

import { writeAudit } from "../audit";
import type { Database } from "../getDb";
import {
  order,
  orderItem,
  paymentEvent,
  productionPackage,
  statusEvent,
  supplier,
} from "../schema";
import { recomputeOrderStatus } from "./rollup";
import { buildAndEncryptSnapshot, readOrderItemConfig } from "./snapshotIo";
import {
  type PipelineDeps,
  type ProcessPaidResult,
  type VerifiedPaidEvent,
  nowIso,
  uuid,
} from "./types";

/**
 * Idempotently process a verified paid event: record the payment event (PK =
 * eventId), then for each order item build an immutable production package from
 * the checkout-frozen config and move it new -> in_review. Two guards make this
 * exactly-once: the paymentEvent PK and the productionPackage.orderItemId unique
 * index. Re-delivery of the same eventId returns duplicate_ignored. (FR-801/802,
 * FR-810/811, FR-830 gate via in_review.)
 */
export async function processPaidEvent(
  db: Database,
  event: VerifiedPaidEvent,
  deps: PipelineDeps,
): Promise<ProcessPaidResult> {
  const now = deps.now ?? nowIso;
  const id = deps.newId ?? uuid;

  const seen = await db.select().from(paymentEvent).where(eq(paymentEvent.eventId, event.eventId));
  if (seen.length > 0) {
    return { status: "duplicate_ignored", productionPackageIds: [] };
  }
  await db.insert(paymentEvent).values({
    eventId: event.eventId,
    orderId: event.orderId,
    type: event.type,
    payload: event.payload,
    processedAt: now(),
  });
  await db
    .update(order)
    .set({ shopifyOrderId: event.shopifyOrderId, updatedAt: now() })
    .where(eq(order.id, event.orderId));

  const [defaultSupplier] = await db.select().from(supplier).where(eq(supplier.isDefault, true));
  const items = await db.select().from(orderItem).where(eq(orderItem.orderId, event.orderId));
  const productionPackageIds: string[] = [];

  for (const item of items) {
    const [existingPkg] = await db
      .select()
      .from(productionPackage)
      .where(eq(productionPackage.orderItemId, item.id));
    if (existingPkg) {
      productionPackageIds.push(existingPkg.id);
      continue;
    }
    if (!item.configEnc) continue; // cannot build a snapshot without frozen config

    const config = await readOrderItemConfig(item.configEnc, deps.measurementKey);
    const { cipher } = await buildAndEncryptSnapshot(config, now(), deps.measurementKey);
    const pkgId = id();
    await db.insert(productionPackage).values({
      id: pkgId,
      orderItemId: item.id,
      garmentType: config.garmentType,
      supplierId: defaultSupplier?.id ?? null,
      snapshotEnc: cipher,
      internalNotes: null,
      createdAt: now(),
    });
    productionPackageIds.push(pkgId);

    await db.insert(statusEvent).values({
      id: id(),
      orderId: event.orderId,
      orderItemId: item.id,
      fromStatus: item.status,
      toStatus: "in_review",
      reason: "paid",
      actor: "system:webhook",
      createdAt: now(),
    });
    await db
      .update(orderItem)
      .set({ status: "in_review", updatedAt: now() })
      .where(eq(orderItem.id, item.id));
  }

  await recomputeOrderStatus(db, event.orderId);
  await writeAudit(db, {
    actor: "system:webhook",
    action: "order.paid.processed",
    entityType: "order",
    entityId: event.orderId,
    detail: { eventId: event.eventId, packages: productionPackageIds.length },
  });
  return { status: "processed", productionPackageIds };
}
