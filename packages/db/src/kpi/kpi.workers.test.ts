import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { encryptJson } from "@cutura/core";

import { getDb } from "../getDb";
import { order, orderItem, statusEvent } from "../schema";
import { computeKpis, getOrderCost, upsertOrderCost } from "./index";

const db = () => getDb(env.TARGET_TEST_DB);
const KEY = "test-measurement-encryption-key";

function config(chest: number) {
  return {
    baseModelName: "Oxford",
    fabricCode: "oxf",
    configuration: {},
    upgrades: [],
    garmentType: "shirt",
    measurementMethod: "wizard",
    measurementProfileVersion: 1,
    confirmedValues: {
      chest,
      waist: 88,
      hips: 96,
      neck: 40,
      shoulder: 46,
      sleeveLength: 64,
      shirtLength: 76,
    },
    price: { base: 12900, fabric: 0, options: 0, upgrades: 0, total: 12900 },
  };
}

async function seedShippedOrder(
  createdAt: string,
  shippedAt: string,
  total: number,
): Promise<string> {
  const orderId = crypto.randomUUID();
  await db().insert(order).values({
    id: orderId,
    orderNumber: orderId,
    totalMinor: total,
    acceptedTermsVersion: "v1",
    acceptedPrivacyVersion: "v1",
    status: "shipped",
    createdAt,
    updatedAt: shippedAt,
  });
  await db()
    .insert(orderItem)
    .values({
      id: crypto.randomUUID(),
      orderId,
      baseModelId: "bm1",
      status: "shipped",
      configEnc: await encryptJson(config(100), KEY, "snapshot"),
      createdAt,
      updatedAt: shippedAt,
    });
  await db().insert(statusEvent).values({
    id: crypto.randomUUID(),
    orderId,
    orderItemId: null,
    fromStatus: "qc_passed",
    toStatus: "shipped",
    actor: "admin",
    createdAt: shippedAt,
  });
  return orderId;
}

describe("computeKpis + cost", () => {
  it("aggregates orders, revenue, lead time, and margin", async () => {
    const orderId = await seedShippedOrder(
      "2026-06-01T00:00:00.000Z",
      "2026-06-11T00:00:00.000Z", // 10 days
      12900,
    );
    await upsertOrderCost(db(), orderId, { fabricMinor: 4000, productionMinor: 3000 });
    expect((await getOrderCost(db(), orderId))?.fabricMinor).toBe(4000);
    // upsert again (same order) keeps a single row
    await upsertOrderCost(db(), orderId, { fabricMinor: 4500, productionMinor: 3000 });
    expect((await getOrderCost(db(), orderId))?.fabricMinor).toBe(4500);

    const k = await computeKpis(db(), KEY);
    expect(k.totalOrders).toBeGreaterThanOrEqual(1);
    expect(k.paidOrders).toBeGreaterThanOrEqual(1);
    expect(k.revenueMinor).toBeGreaterThanOrEqual(12900);
    expect(k.avgLeadTimeDays).not.toBeNull();
    expect(k.avgMarginMinor).not.toBeNull();
  });
});
