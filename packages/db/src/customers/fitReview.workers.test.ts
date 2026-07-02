import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { getDb } from "../getDb";
import { buildAndEncryptSnapshot } from "../orders/snapshotIo";
import { fitReview, order, orderItem, productionPackage, statusEvent } from "../schema";
import { findOrCreateCustomer } from "./auth";
import { submitFitReview } from "./fitReview";
import { createRemakeFromOrder } from "./remake";

const db = () => getDb(env.TARGET_TEST_DB);
const KEY = "test-measurement-encryption-key";
const NOW = "2026-06-24T10:00:00.000Z";

function cfg() {
  return {
    baseModelName: "Oxford",
    fabricCode: "oxf",
    configuration: { collar: "kent" },
    upgrades: [],
    garmentType: "shirt",
    measurementMethod: "wizard" as const,
    measurementProfileVersion: 1,
    confirmedValues: {
      neck: 39,
      shoulder: 46,
      backWidth: 44,
      aboveChest: 96,
      chest: 100,
      armhole: 46,
      biceps: 35,
      wrist: 17,
      sleeveLength: 64,
      shirtLength: 76,
    },
    price: { base: 12900, fabric: 0, options: 0, upgrades: 0, total: 12900 },
  };
}

async function seed(
  customerId: string,
  shippedAt: string,
): Promise<{ orderId: string; itemId: string }> {
  const orderId = crypto.randomUUID();
  await db().insert(order).values({
    id: orderId,
    orderNumber: orderId,
    customerId,
    totalMinor: 12900,
    acceptedTermsVersion: "v1",
    acceptedPrivacyVersion: "v1",
    status: "shipped",
    createdAt: shippedAt,
    updatedAt: shippedAt,
  });
  const itemId = crypto.randomUUID();
  await db().insert(orderItem).values({
    id: itemId,
    orderId,
    baseModelId: "bm1",
    status: "shipped",
    createdAt: shippedAt,
    updatedAt: shippedAt,
  });
  const { cipher } = await buildAndEncryptSnapshot(cfg(), shippedAt, KEY);
  await db().insert(productionPackage).values({
    id: crypto.randomUUID(),
    orderItemId: itemId,
    garmentType: "shirt",
    supplierId: null,
    snapshotEnc: cipher,
    createdAt: shippedAt,
  });
  await db().insert(statusEvent).values({
    id: crypto.randomUUID(),
    orderId,
    orderItemId: itemId,
    fromStatus: "qc_passed",
    toStatus: "shipped",
    actor: "admin",
    createdAt: shippedAt,
  });
  return { orderId, itemId };
}

describe("fit review + remake", () => {
  it("accepts within window, then blocks a second per garment type", async () => {
    const { customer } = await findOrCreateCustomer(db(), `f_${crypto.randomUUID()}@x.ch`, "de");
    const { orderId } = await seed(customer.id, "2026-06-20T00:00:00.000Z");
    const r1 = await submitFitReview(
      db(),
      { customerId: customer.id, orderId, reason: "sleeves long" },
      { now: () => NOW },
    );
    expect(r1.ok).toBe(true);
    const { orderId: o2 } = await seed(customer.id, "2026-06-21T00:00:00.000Z");
    const r2 = await submitFitReview(
      db(),
      { customerId: customer.id, orderId: o2, reason: "again" },
      { now: () => NOW },
    );
    expect(r2).toEqual({ ok: false, reason: "already" });
  });

  it("rejects out-of-window and non-owner requests", async () => {
    const { customer } = await findOrCreateCustomer(db(), `f_${crypto.randomUUID()}@x.ch`, "de");
    const old = await seed(customer.id, "2026-01-01T00:00:00.000Z");
    expect(
      (
        await submitFitReview(
          db(),
          { customerId: customer.id, orderId: old.orderId, reason: "x" },
          { now: () => NOW },
        )
      ).ok,
    ).toBe(false);
    const { customer: other } = await findOrCreateCustomer(
      db(),
      `g_${crypto.randomUUID()}@x.ch`,
      "de",
    );
    const fresh = await seed(customer.id, "2026-06-20T00:00:00.000Z");
    expect(
      await submitFitReview(
        db(),
        { customerId: other.id, orderId: fresh.orderId, reason: "x" },
        { now: () => NOW },
      ),
    ).toEqual({ ok: false, reason: "not_owner" });
  });

  it("creates a linked remake from the original snapshot without mutating the original", async () => {
    const { customer } = await findOrCreateCustomer(db(), `f_${crypto.randomUUID()}@x.ch`, "de");
    const { orderId, itemId } = await seed(customer.id, "2026-06-20T00:00:00.000Z");
    const r = await submitFitReview(
      db(),
      { customerId: customer.id, orderId, reason: "x" },
      { now: () => NOW },
    );
    if (!r.ok) throw new Error("expected ok");

    const remake = await createRemakeFromOrder(
      db(),
      { fitReviewId: r.id, originalOrderItemId: itemId, adjustment: { sleeveLength: -1 } },
      KEY,
    );
    const [ro] = await db().select().from(order).where(eq(order.id, remake.remakeOrderId));
    expect(ro?.status).toBe("in_review");
    expect(ro?.totalMinor).toBe(0);
    const [oi] = await db().select().from(orderItem).where(eq(orderItem.id, itemId));
    expect(oi?.status).toBe("shipped"); // original unchanged
    const [fr] = await db().select().from(fitReview).where(eq(fitReview.id, r.id));
    expect(fr?.remakeOrderId).toBe(remake.remakeOrderId);
    expect(fr?.decision).toBe("remake");
  });
});
