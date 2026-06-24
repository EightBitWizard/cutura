import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { type GarmentMeasurements, encryptJson, getDefaultQcChecklist } from "@cutura/core";

import { getDb } from "../getDb";
import { order, orderItem, productionPackage } from "../schema";
import { applyQcOverride, submitQc } from "./qc";
import { computeOrderRollup } from "./rollup";
import { processPaidEvent } from "./pipeline";
import { readSnapshot } from "./snapshotIo";
import { InvalidTransitionError, OverrideNotAllowedError, ShippingBlockedError } from "./types";
import { shipOrder, transitionOrderItem } from "./transitions";

const KEY = "test-measurement-encryption-key";
const db = () => getDb(env.TARGET_TEST_DB);
const iso = "2026-06-24T10:00:00.000Z";

const confirmed: GarmentMeasurements = {
  chest: 100,
  waist: 88,
  hips: 96,
  neck: 40,
  shoulder: 46,
  sleeveLength: 64,
  shirtLength: 76,
};

function sampleConfig() {
  return {
    baseModelName: "Oxford White",
    fabricCode: "oxf-white",
    configuration: { collar: "kent" },
    upgrades: [],
    garmentType: "shirt",
    measurementMethod: "wizard" as const,
    measurementProfileVersion: 1,
    confirmedValues: confirmed,
    price: { base: 12900, fabric: 0, options: 0, upgrades: 0, total: 12900 },
  };
}

async function seedOrder(itemCount: number): Promise<{ orderId: string; itemIds: string[] }> {
  const orderId = crypto.randomUUID();
  await db().insert(order).values({
    id: orderId,
    orderNumber: orderId,
    totalMinor: 12900,
    acceptedTermsVersion: "2026-06-24",
    acceptedPrivacyVersion: "2026-06-24",
    status: "new",
    createdAt: iso,
    updatedAt: iso,
  });
  const itemIds: string[] = [];
  for (let i = 0; i < itemCount; i++) {
    const itemId = crypto.randomUUID();
    const configEnc = await encryptJson(sampleConfig(), KEY, "snapshot");
    await db().insert(orderItem).values({
      id: itemId,
      orderId,
      baseModelId: "bm1",
      status: "new",
      configEnc,
      createdAt: iso,
      updatedAt: iso,
    });
    itemIds.push(itemId);
  }
  return { orderId, itemIds };
}

function paidEvent(orderId: string, eventId = crypto.randomUUID()) {
  return {
    eventId,
    shopifyOrderId: `shop_${orderId}`,
    orderId,
    type: "orders/paid",
    payload: { ok: true },
  };
}

async function advanceToArrived(orderItemId: string): Promise<void> {
  await transitionOrderItem(db(), { orderItemId, to: "approved", actor: "admin" });
  await transitionOrderItem(db(), { orderItemId, to: "in_production", actor: "admin" });
  await transitionOrderItem(db(), { orderItemId, to: "arrived_ch", actor: "admin" });
}

describe("computeOrderRollup", () => {
  it("is the slowest item; escalation states dominate", () => {
    expect(computeOrderRollup(["qc_passed", "in_production"])).toBe("in_production");
    expect(computeOrderRollup(["qc_passed", "qc_passed"])).toBe("qc_passed");
    expect(computeOrderRollup(["shipped", "shipped"])).toBe("shipped");
    expect(computeOrderRollup(["qc_passed", "problem"])).toBe("problem");
    expect(computeOrderRollup(["qc_passed", "qc_failed"])).toBe("qc_failed");
  });
});

describe("processPaidEvent", () => {
  it("creates one production package per item and moves to in_review", async () => {
    const { orderId, itemIds } = await seedOrder(2);
    const result = await processPaidEvent(db(), paidEvent(orderId), { measurementKey: KEY });
    expect(result.status).toBe("processed");
    expect(result.productionPackageIds).toHaveLength(2);

    const items = await db().select().from(orderItem).where(eq(orderItem.orderId, orderId));
    expect(items.every((i) => i.status === "in_review")).toBe(true);
    const [row] = await db().select().from(order).where(eq(order.id, orderId));
    expect(row?.status).toBe("in_review");
    expect(row?.shopifyOrderId).toBe(`shop_${orderId}`);
    void itemIds;
  });

  it("is idempotent on the event id (no duplicate packages)", async () => {
    const { orderId } = await seedOrder(1);
    const event = paidEvent(orderId);
    const first = await processPaidEvent(db(), event, { measurementKey: KEY });
    const second = await processPaidEvent(db(), event, { measurementKey: KEY });
    expect(first.status).toBe("processed");
    expect(second.status).toBe("duplicate_ignored");
  });

  it("freezes a decryptable, complete snapshot", async () => {
    const { orderId } = await seedOrder(1);
    const result = await processPaidEvent(db(), paidEvent(orderId), { measurementKey: KEY });
    const [pkg] = await db()
      .select()
      .from(productionPackage)
      .where(eq(productionPackage.id, result.productionPackageIds[0]!));
    const snapshot = await readSnapshot(pkg!.snapshotEnc, KEY);
    expect(snapshot.effectiveMeasurements).toEqual(confirmed);
    expect(snapshot.price.total).toBe(12900);
    expect(snapshot.baseModelName).toBe("Oxford White");
    expect(snapshot.fabricCode).toBe("oxf-white");
    expect(snapshot.garmentType).toBe("shirt");
    expect(snapshot.createdAt).toBeTruthy();
  });
});

describe("transitions + QC", () => {
  it("rejects an invalid transition", async () => {
    const { orderId, itemIds } = await seedOrder(1);
    await processPaidEvent(db(), paidEvent(orderId), { measurementKey: KEY });
    await expect(
      transitionOrderItem(db(), { orderItemId: itemIds[0]!, to: "shipped", actor: "admin" }),
    ).rejects.toBeInstanceOf(InvalidTransitionError);
  });

  it("never lets a QC fail become a pass without an audited override", async () => {
    const { orderId, itemIds } = await seedOrder(1);
    await processPaidEvent(db(), paidEvent(orderId), { measurementKey: KEY });
    await advanceToArrived(itemIds[0]!);

    const [pkg] = await db()
      .select()
      .from(productionPackage)
      .where(eq(productionPackage.orderItemId, itemIds[0]!));
    const checklist = getDefaultQcChecklist("shirt").map((c, i) => ({
      ...c,
      result: i === 0 ? ("fail" as const) : ("ok" as const),
    }));
    const qc = await submitQc(db(), {
      productionPackageId: pkg!.id,
      checklist,
      reviewedBy: "qc",
    });
    expect(qc.overallResult).toBe("fail");
    expect(qc.itemStatus).toBe("qc_failed");

    // A direct transition to qc_passed from qc_failed is not a normal transition.
    await expect(
      transitionOrderItem(db(), { orderItemId: itemIds[0]!, to: "qc_passed", actor: "admin" }),
    ).rejects.toBeInstanceOf(InvalidTransitionError);

    // The only path past a fail is the audited override.
    await applyQcOverride(db(), {
      orderItemId: itemIds[0]!,
      overrideReason: "minor, accepted",
      overrideBy: "founder",
    });
    const [item] = await db().select().from(orderItem).where(eq(orderItem.id, itemIds[0]!));
    expect(item?.status).toBe("qc_passed");
  });

  it("blocks override from a non-failed state", async () => {
    const { orderId, itemIds } = await seedOrder(1);
    await processPaidEvent(db(), paidEvent(orderId), { measurementKey: KEY });
    await expect(
      applyQcOverride(db(), { orderItemId: itemIds[0]!, overrideReason: "x", overrideBy: "f" }),
    ).rejects.toBeInstanceOf(OverrideNotAllowedError);
  });

  it("ships together only when all items pass QC", async () => {
    const { orderId, itemIds } = await seedOrder(2);
    await processPaidEvent(db(), paidEvent(orderId), { measurementKey: KEY });
    for (const id of itemIds) await advanceToArrived(id);

    // Pass the first item only.
    const [pkg0] = await db()
      .select()
      .from(productionPackage)
      .where(eq(productionPackage.orderItemId, itemIds[0]!));
    const okChecklist = getDefaultQcChecklist("shirt").map((c) => ({
      ...c,
      result: "ok" as const,
    }));
    await submitQc(db(), {
      productionPackageId: pkg0!.id,
      checklist: okChecklist,
      reviewedBy: "qc",
    });

    await expect(shipOrder(db(), { orderId, actor: "admin" })).rejects.toBeInstanceOf(
      ShippingBlockedError,
    );

    // Pass the second item, then ship.
    const [pkg1] = await db()
      .select()
      .from(productionPackage)
      .where(eq(productionPackage.orderItemId, itemIds[1]!));
    await submitQc(db(), {
      productionPackageId: pkg1!.id,
      checklist: okChecklist,
      reviewedBy: "qc",
    });
    await shipOrder(db(), { orderId, actor: "admin" });

    const items = await db().select().from(orderItem).where(eq(orderItem.orderId, orderId));
    expect(items.every((i) => i.status === "shipped")).toBe(true);
    const [row] = await db().select().from(order).where(eq(order.id, orderId));
    expect(row?.status).toBe("shipped");
  });
});
