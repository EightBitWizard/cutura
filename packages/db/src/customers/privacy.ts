import { eq, inArray } from "drizzle-orm";

import { type GarmentMeasurements, decryptJson } from "@cutura/core";

import { writeAudit } from "../audit";
import type { Database } from "../getDb";
import {
  address,
  communicationLog,
  customer,
  fitFeedback,
  fitReview,
  measurementProfile,
  measurementVersion,
  notifyRequest,
  order,
  orderItem,
  paymentEvent,
  productionPackage,
  qcRecord,
  session,
} from "../schema";

/** Minimal R2 surface; a Cloudflare R2Bucket satisfies it. Injected so the helper is env-free + testable. */
export interface R2Like {
  delete(key: string): Promise<void>;
}

const REDACTED = "REDACTED";

export interface DeletionReport {
  addresses: number;
  profiles: number;
  versions: number;
  sessions: number;
  fitReviews: number;
  fitFeedback: number;
  notifyRequests: number;
  ordersScrubbed: number;
  photosDeleted: number;
}

function toKeys(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((k): k is string => typeof k === "string") : [];
}

/**
 * Erase a customer's personal data (FR-670/671). Personal data is hard-deleted;
 * order/accounting records are KEPT for legal retention but fully scrubbed of PII
 * and body data (guest identifiers, encrypted config/snapshot, recipient emails,
 * photos). R2 photos are removed. The customer row is tombstoned (kept as the FK
 * target). Idempotent.
 */
export async function deleteCustomerData(
  db: Database,
  customerId: string,
  r2: R2Like,
  deps: { now?: () => string } = {},
): Promise<DeletionReport> {
  const now = (deps.now ?? (() => new Date().toISOString()))();

  const ids = async <T extends { id: string }>(rows: T[]) => rows.map((r) => r.id);
  const orderIds = await ids(
    await db.select({ id: order.id }).from(order).where(eq(order.customerId, customerId)),
  );
  const profileIds = await ids(
    await db
      .select({ id: measurementProfile.id })
      .from(measurementProfile)
      .where(eq(measurementProfile.customerId, customerId)),
  );
  const addressIds = await ids(
    await db.select({ id: address.id }).from(address).where(eq(address.customerId, customerId)),
  );
  const sessionIds = await ids(
    await db.select({ id: session.id }).from(session).where(eq(session.customerId, customerId)),
  );
  const [cust] = await db
    .select({ email: customer.email })
    .from(customer)
    .where(eq(customer.id, customerId));
  const notifyIds = cust?.email
    ? await ids(
        await db
          .select({ id: notifyRequest.id })
          .from(notifyRequest)
          .where(eq(notifyRequest.email, cust.email)),
      )
    : [];

  const itemIds = orderIds.length
    ? await ids(
        await db
          .select({ id: orderItem.id })
          .from(orderItem)
          .where(inArray(orderItem.orderId, orderIds)),
      )
    : [];
  const pkgIds = itemIds.length
    ? await ids(
        await db
          .select({ id: productionPackage.id })
          .from(productionPackage)
          .where(inArray(productionPackage.orderItemId, itemIds)),
      )
    : [];

  // Collect + delete R2 photos (qc + fit-review) before removing their rows.
  const photoKeys: string[] = [];
  if (pkgIds.length) {
    const rows = await db
      .select({ p: qcRecord.photoR2Keys })
      .from(qcRecord)
      .where(inArray(qcRecord.productionPackageId, pkgIds));
    for (const r of rows) photoKeys.push(...toKeys(r.p));
  }
  if (orderIds.length) {
    const rows = await db
      .select({ p: fitReview.photoR2Keys })
      .from(fitReview)
      .where(inArray(fitReview.orderId, orderIds));
    for (const r of rows) photoKeys.push(...toKeys(r.p));
  }
  const counts = { fitReviews: 0, fitFeedback: 0, versions: 0 };
  if (profileIds.length) {
    counts.versions = (
      await db
        .select({ id: measurementVersion.id })
        .from(measurementVersion)
        .where(inArray(measurementVersion.profileId, profileIds))
    ).length;
  }
  if (orderIds.length) {
    counts.fitReviews = (
      await db
        .select({ id: fitReview.id })
        .from(fitReview)
        .where(inArray(fitReview.orderId, orderIds))
    ).length;
    counts.fitFeedback = (
      await db
        .select({ id: fitFeedback.id })
        .from(fitFeedback)
        .where(inArray(fitFeedback.orderId, orderIds))
    ).length;
  }
  for (const key of photoKeys) await r2.delete(key);

  // Hard-delete personal data.
  await db.delete(address).where(eq(address.customerId, customerId));
  if (profileIds.length)
    await db.delete(measurementVersion).where(inArray(measurementVersion.profileId, profileIds));
  await db.delete(measurementProfile).where(eq(measurementProfile.customerId, customerId));
  await db.delete(session).where(eq(session.customerId, customerId));
  if (orderIds.length) {
    await db.delete(fitReview).where(inArray(fitReview.orderId, orderIds));
    await db.delete(fitFeedback).where(inArray(fitFeedback.orderId, orderIds));
  }
  if (notifyIds.length && cust?.email) {
    await db.delete(notifyRequest).where(eq(notifyRequest.email, cust.email));
  }

  // Scrub-keep order/accounting records.
  if (orderIds.length) {
    await db
      .update(order)
      .set({ guestEmail: null, guestTrackingToken: null, updatedAt: now })
      .where(eq(order.customerId, customerId));
    if (itemIds.length) {
      await db
        .update(orderItem)
        .set({ configEnc: null, updatedAt: now })
        .where(inArray(orderItem.id, itemIds));
    }
    if (pkgIds.length) {
      await db
        .update(productionPackage)
        .set({ snapshotEnc: REDACTED })
        .where(inArray(productionPackage.id, pkgIds));
      await db
        .update(qcRecord)
        .set({ photoR2Keys: null })
        .where(inArray(qcRecord.productionPackageId, pkgIds));
    }
    await db
      .update(communicationLog)
      .set({ toAddress: "" })
      .where(inArray(communicationLog.orderId, orderIds));
    await db
      .update(paymentEvent)
      .set({ payload: null })
      .where(inArray(paymentEvent.orderId, orderIds));
  }

  // Tombstone the customer.
  await db
    .update(customer)
    .set({
      email: `deleted-${customerId}@deleted.invalid`,
      deletionState: "deleted",
      updatedAt: now,
    })
    .where(eq(customer.id, customerId));

  await writeAudit(db, {
    actor: `customer:${customerId}`,
    action: "customer.data.deleted",
    entityType: "customer",
    entityId: customerId,
    detail: { orders: orderIds.length, photos: photoKeys.length },
  });

  return {
    addresses: addressIds.length,
    profiles: profileIds.length,
    versions: counts.versions,
    sessions: sessionIds.length,
    fitReviews: counts.fitReviews,
    fitFeedback: counts.fitFeedback,
    notifyRequests: notifyIds.length,
    ordersScrubbed: orderIds.length,
    photosDeleted: photoKeys.length,
  };
}

export interface CustomerExport {
  customer: { id: string; email: string; locale: string; createdAt: string };
  profiles: Array<{ id: string; name: string | null; confirmed: GarmentMeasurements | null }>;
  addresses: Array<typeof address.$inferSelect>;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalMinor: number;
    createdAt: string;
  }>;
  fitFeedback: Array<typeof fitFeedback.$inferSelect>;
}

/** Gather the customer's own data for export (FR-680). Measurements are decrypted (their own data). */
export async function exportCustomerData(
  db: Database,
  customerId: string,
  key: string,
): Promise<CustomerExport | null> {
  const [cust] = await db.select().from(customer).where(eq(customer.id, customerId));
  if (!cust) return null;

  const profileRows = await db
    .select()
    .from(measurementProfile)
    .where(eq(measurementProfile.customerId, customerId));
  const profiles: CustomerExport["profiles"] = [];
  for (const p of profileRows) {
    const [v] = await db
      .select({ enc: measurementVersion.confirmedValuesEnc })
      .from(measurementVersion)
      .where(eq(measurementVersion.profileId, p.id))
      .orderBy(measurementVersion.version);
    let confirmed: GarmentMeasurements | null = null;
    if (v?.enc) {
      try {
        confirmed = await decryptJson<GarmentMeasurements>(v.enc, key, "measurement_version");
      } catch {
        confirmed = null;
      }
    }
    profiles.push({ id: p.id, name: p.name, confirmed });
  }

  const addresses = await db.select().from(address).where(eq(address.customerId, customerId));
  const orderRows = await db.select().from(order).where(eq(order.customerId, customerId));
  const feedbackRows = orderRows.length
    ? await db
        .select()
        .from(fitFeedback)
        .where(
          inArray(
            fitFeedback.orderId,
            orderRows.map((o) => o.id),
          ),
        )
    : [];

  return {
    customer: { id: cust.id, email: cust.email, locale: cust.locale, createdAt: cust.createdAt },
    profiles,
    addresses,
    orders: orderRows.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      totalMinor: o.totalMinor,
      createdAt: o.createdAt,
    })),
    fitFeedback: feedbackRows,
  };
}
