import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { encryptJson } from "@cutura/core";

import { getDb } from "../getDb";
import { order, orderItem, statusEvent } from "../schema";
import { findOrCreateCustomer } from "./auth";
import { getCustomerOrderDetail, getOrderByTrackingToken, listCustomerOrders } from "./orders";

const db = () => getDb(env.TARGET_TEST_DB);
const KEY = "test-measurement-encryption-key";
const iso = "2026-06-24T10:00:00.000Z";

function sampleConfig() {
  return {
    baseModelName: "Oxford White",
    fabricCode: "oxf-white",
    configuration: { collar: "kent" },
    upgrades: [],
    garmentType: "shirt",
    measurementMethod: "wizard",
    measurementProfileVersion: 1,
    confirmedValues: {
      chest: 100,
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

async function seedOrder(customerId: string | null, token: string): Promise<string> {
  const orderId = crypto.randomUUID();
  await db()
    .insert(order)
    .values({
      id: orderId,
      orderNumber: orderId,
      customerId,
      guestEmail: customerId ? null : "g@x.ch",
      guestTrackingToken: token,
      totalMinor: 12900,
      acceptedTermsVersion: "v1",
      acceptedPrivacyVersion: "v1",
      status: "in_production",
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
      status: "in_production",
      configEnc: await encryptJson(sampleConfig(), KEY, "snapshot"),
      createdAt: iso,
      updatedAt: iso,
    });
  await db().insert(statusEvent).values({
    id: crypto.randomUUID(),
    orderId,
    orderItemId: itemId,
    fromStatus: "approved",
    toStatus: "in_production",
    actor: "admin",
    createdAt: iso,
  });
  return orderId;
}

describe("customer orders", () => {
  it("lists, details (decrypted summary + timeline), and tracks by token", async () => {
    const { customer } = await findOrCreateCustomer(db(), `co_${crypto.randomUUID()}@x.ch`, "de");
    const token = crypto.randomUUID();
    const orderId = await seedOrder(customer.id, token);

    const list = await listCustomerOrders(db(), customer.id);
    expect(list.find((o) => o.id === orderId)?.milestone).toBe("in_production");

    const detail = await getCustomerOrderDetail(db(), customer.id, orderId, KEY);
    expect(detail?.items[0]?.baseModelName).toBe("Oxford White");
    expect(detail?.milestone).toBe("in_production");
    expect(detail?.timeline.map((t) => t.milestone)).toContain("in_production");

    const byToken = await getOrderByTrackingToken(db(), token, KEY);
    expect(byToken?.orderNumber).toBe(detail?.orderNumber);
  });

  it("rejects another customer's order and an unknown token", async () => {
    const { customer: a } = await findOrCreateCustomer(db(), `a_${crypto.randomUUID()}@x.ch`, "de");
    const { customer: b } = await findOrCreateCustomer(db(), `b_${crypto.randomUUID()}@x.ch`, "de");
    const orderId = await seedOrder(a.id, crypto.randomUUID());
    expect(await getCustomerOrderDetail(db(), b.id, orderId, KEY)).toBeNull();
    expect(await getOrderByTrackingToken(db(), "nope", KEY)).toBeNull();
  });
});
