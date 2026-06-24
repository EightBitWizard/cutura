import { eq } from "drizzle-orm";

import { type PerPieceOverride, encryptJson, randomToken } from "@cutura/core";

import { writeAudit } from "../audit";
import type { Database } from "../getDb";
import { buildAndEncryptSnapshot, readSnapshot } from "../orders/snapshotIo";
import type { OrderItemConfig } from "../orders/types";
import { fitReview, order, orderItem, productionPackage, statusEvent } from "../schema";
import type { CustomerClock } from "./auth";

const nowIso = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

/**
 * Create a remake as a linked, unpaid internal order built from the ORIGINAL
 * production snapshot (+ optional adjustment), at status in_review (FR-8A1). The
 * original order/snapshot is never mutated. Links via fitReview.remakeOrderId and
 * records the decision = remake.
 */
export async function createRemakeFromOrder(
  db: Database,
  input: { fitReviewId: string; originalOrderItemId: string; adjustment?: PerPieceOverride },
  key: string,
  deps: CustomerClock = {},
): Promise<{ remakeOrderId: string; remakeOrderItemId: string }> {
  const [pkg] = await db
    .select()
    .from(productionPackage)
    .where(eq(productionPackage.orderItemId, input.originalOrderItemId));
  if (!pkg) throw new Error(`no production package for ${input.originalOrderItemId}`);
  const snapshot = await readSnapshot(pkg.snapshotEnc, key);

  const [origItem] = await db
    .select()
    .from(orderItem)
    .where(eq(orderItem.id, input.originalOrderItemId));
  if (!origItem) throw new Error(`order item not found: ${input.originalOrderItemId}`);
  const [origOrder] = await db.select().from(order).where(eq(order.id, origItem.orderId));
  if (!origOrder) throw new Error(`order not found: ${origItem.orderId}`);

  const now = deps.now ?? nowIso;
  const id = deps.newId ?? uuid;

  // Remake config: the original effective measurements as the base + the adjustment;
  // price zeroed (a remake is not re-charged).
  const config: OrderItemConfig = {
    baseModelName: snapshot.baseModelName,
    fabricCode: snapshot.fabricCode,
    configuration: snapshot.configuration,
    upgrades: snapshot.upgrades,
    garmentType: snapshot.garmentType,
    measurementMethod: snapshot.measurementMethod,
    measurementProfileVersion: snapshot.measurementProfileVersion,
    confirmedValues: snapshot.effectiveMeasurements,
    override: input.adjustment,
    price: { base: 0, fabric: 0, options: 0, upgrades: 0, total: 0 },
  };

  const remakeOrderId = id();
  const orderNumber = `RMK-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  await db.insert(order).values({
    id: remakeOrderId,
    orderNumber,
    customerId: origOrder.customerId,
    guestEmail: origOrder.guestEmail,
    guestTrackingToken: randomToken(24),
    locale: origOrder.locale,
    totalMinor: 0,
    acceptedTermsVersion: origOrder.acceptedTermsVersion,
    acceptedPrivacyVersion: origOrder.acceptedPrivacyVersion,
    status: "new",
    createdAt: now(),
    updatedAt: now(),
  });

  const remakeItemId = id();
  const { cipher: snapshotCipher } = await buildAndEncryptSnapshot(config, now(), key);
  await db.insert(orderItem).values({
    id: remakeItemId,
    orderId: remakeOrderId,
    baseModelId: origItem.baseModelId,
    status: "in_review",
    configEnc: await encryptJson(config, key, "snapshot"),
    createdAt: now(),
    updatedAt: now(),
  });
  await db.insert(productionPackage).values({
    id: id(),
    orderItemId: remakeItemId,
    garmentType: snapshot.garmentType,
    supplierId: pkg.supplierId,
    snapshotEnc: snapshotCipher,
    internalNotes: "remake",
    createdAt: now(),
  });
  await db.insert(statusEvent).values({
    id: id(),
    orderId: remakeOrderId,
    orderItemId: remakeItemId,
    fromStatus: "new",
    toStatus: "in_review",
    reason: "remake",
    actor: "system:remake",
    createdAt: now(),
  });
  await db
    .update(order)
    .set({ status: "in_review", updatedAt: now() })
    .where(eq(order.id, remakeOrderId));

  await db
    .update(fitReview)
    .set({ remakeOrderId, decision: "remake", status: "decided", updatedAt: now() })
    .where(eq(fitReview.id, input.fitReviewId));
  await writeAudit(db, {
    actor: "system:remake",
    action: "order.remake.created",
    entityType: "order",
    entityId: remakeOrderId,
    detail: { fitReviewId: input.fitReviewId, fromOrderItemId: input.originalOrderItemId },
  });
  return { remakeOrderId, remakeOrderItemId: remakeItemId };
}
