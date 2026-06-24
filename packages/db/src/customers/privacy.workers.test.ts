import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { encryptJson } from "@cutura/core";

import { getDb } from "../getDb";
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
import { findOrCreateCustomer } from "./auth";
import { deleteCustomerData, exportCustomerData } from "./privacy";

const db = () => getDb(env.TARGET_TEST_DB);
const KEY = "test-measurement-encryption-key";
const iso = "2026-06-24T10:00:00.000Z";

class FakeR2 {
  deleted: string[] = [];
  async delete(key: string) {
    this.deleted.push(key);
  }
}

async function seedFootprint(customerId: string, email: string) {
  const profileId = crypto.randomUUID();
  await db().insert(measurementProfile).values({
    id: profileId,
    customerId,
    name: "P",
    currentVersion: 1,
    createdAt: iso,
    updatedAt: iso,
  });
  await db()
    .insert(measurementVersion)
    .values({
      id: crypto.randomUUID(),
      profileId,
      version: 1,
      previousVersion: null,
      garmentType: "shirt",
      method: "wizard",
      originalInputsEnc: null,
      derivedValuesEnc: null,
      confirmedValuesEnc: await encryptJson({ chest: 100 }, KEY, "measurement_version"),
      createdAt: iso,
    });
  await db().insert(address).values({
    id: crypto.randomUUID(),
    customerId,
    line1: "A",
    city: "Z",
    zip: "8001",
    country: "CH",
    isDefault: true,
    createdAt: iso,
    updatedAt: iso,
  });
  await db()
    .insert(session)
    .values({ id: crypto.randomUUID(), customerId, expiresAt: iso, createdAt: iso });
  await db().insert(notifyRequest).values({
    id: crypto.randomUUID(),
    email,
    entityType: "fabric",
    entityId: "f1",
    locale: "de",
    notifiedAt: null,
    createdAt: iso,
  });

  const orderId = crypto.randomUUID();
  await db().insert(order).values({
    id: orderId,
    orderNumber: orderId,
    customerId,
    guestEmail: email,
    guestTrackingToken: crypto.randomUUID(),
    totalMinor: 12900,
    acceptedTermsVersion: "v1",
    acceptedPrivacyVersion: "v1",
    status: "shipped",
    createdAt: iso,
    updatedAt: iso,
  });
  const itemId = crypto.randomUUID();
  await db()
    .insert(orderItem)
    .values({
      id: itemId,
      orderId,
      baseModelId: "bm1",
      status: "shipped",
      configEnc: await encryptJson({ x: 1 }, KEY, "snapshot"),
      createdAt: iso,
      updatedAt: iso,
    });
  const pkgId = crypto.randomUUID();
  await db()
    .insert(productionPackage)
    .values({
      id: pkgId,
      orderItemId: itemId,
      garmentType: "shirt",
      supplierId: null,
      snapshotEnc: await encryptJson({ y: 2 }, KEY, "snapshot"),
      createdAt: iso,
    });
  await db()
    .insert(qcRecord)
    .values({
      id: crypto.randomUUID(),
      productionPackageId: pkgId,
      checklist: [],
      overallResult: "pass",
      photoR2Keys: ["qc/photo1"],
      reviewedBy: "qc",
      createdAt: iso,
      updatedAt: iso,
    });
  await db()
    .insert(fitReview)
    .values({
      id: crypto.randomUUID(),
      orderId,
      orderItemId: itemId,
      reason: "long",
      photoR2Keys: ["fr/photo1"],
      status: "open",
      createdAt: iso,
      updatedAt: iso,
    });
  await db().insert(fitFeedback).values({
    id: crypto.randomUUID(),
    orderId,
    overallRating: 4,
    wantsRemake: false,
    createdAt: iso,
    updatedAt: iso,
  });
  await db().insert(communicationLog).values({
    id: crypto.randomUUID(),
    orderId,
    channel: "email",
    template: "order_confirmation",
    toAddress: email,
    status: "sent",
    createdAt: iso,
  });
  await db().insert(paymentEvent).values({
    eventId: crypto.randomUUID(),
    orderId,
    type: "orders/paid",
    payload: { email },
    processedAt: iso,
  });
  return { orderId, itemId, pkgId };
}

describe("deleteCustomerData (the privacy gate)", () => {
  it("erases personal data, scrubs retained orders, deletes photos, and is idempotent", async () => {
    const email = `del_${crypto.randomUUID()}@x.ch`;
    const { customer: c } = await findOrCreateCustomer(db(), email, "de");
    const { orderId, itemId, pkgId } = await seedFootprint(c.id, c.email);

    const r2 = new FakeR2();
    const report = await deleteCustomerData(db(), c.id, r2);
    expect(report.addresses).toBe(1);
    expect(report.profiles).toBe(1);
    expect(report.notifyRequests).toBe(1);
    expect(r2.deleted.sort()).toEqual(["fr/photo1", "qc/photo1"]);

    // Personal data gone.
    expect((await db().select().from(address).where(eq(address.customerId, c.id))).length).toBe(0);
    expect(
      (await db().select().from(measurementProfile).where(eq(measurementProfile.customerId, c.id)))
        .length,
    ).toBe(0);
    expect((await db().select().from(session).where(eq(session.customerId, c.id))).length).toBe(0);
    expect((await db().select().from(fitReview).where(eq(fitReview.orderId, orderId))).length).toBe(
      0,
    );
    expect(
      (await db().select().from(fitFeedback).where(eq(fitFeedback.orderId, orderId))).length,
    ).toBe(0);
    expect(
      (await db().select().from(notifyRequest).where(eq(notifyRequest.email, email))).length,
    ).toBe(0);

    // Retained order, scrubbed.
    const [o] = await db().select().from(order).where(eq(order.id, orderId));
    expect(o?.guestEmail).toBeNull();
    expect(o?.guestTrackingToken).toBeNull();
    const [it] = await db().select().from(orderItem).where(eq(orderItem.id, itemId));
    expect(it?.configEnc).toBeNull();
    const [pkg] = await db()
      .select()
      .from(productionPackage)
      .where(eq(productionPackage.id, pkgId));
    expect(pkg?.snapshotEnc).toBe("REDACTED");
    const [qc] = await db().select().from(qcRecord).where(eq(qcRecord.productionPackageId, pkgId));
    expect(qc?.photoR2Keys).toBeNull();
    const [cl] = await db()
      .select()
      .from(communicationLog)
      .where(eq(communicationLog.orderId, orderId));
    expect(cl?.toAddress).toBe("");
    const [pe] = await db().select().from(paymentEvent).where(eq(paymentEvent.orderId, orderId));
    expect(pe?.payload).toBeNull();

    // Customer tombstoned.
    const [tomb] = await db().select().from(customer).where(eq(customer.id, c.id));
    expect(tomb?.deletionState).toBe("deleted");
    expect(tomb?.email).not.toBe(email);

    // Idempotent re-run.
    const r2b = new FakeR2();
    const again = await deleteCustomerData(db(), c.id, r2b);
    expect(again.ordersScrubbed).toBe(1);
    expect(r2b.deleted).toEqual([]);
  });

  it("exports the customer's own data", async () => {
    const email = `exp_${crypto.randomUUID()}@x.ch`;
    const { customer: c } = await findOrCreateCustomer(db(), email, "de");
    await seedFootprint(c.id, c.email);
    const dump = await exportCustomerData(db(), c.id, KEY);
    expect(dump?.customer.email).toBe(email);
    expect(dump?.profiles[0]?.confirmed).toEqual({ chest: 100 });
    expect(dump?.orders.length).toBe(1);
    expect(dump?.addresses.length).toBe(1);
  });
});
