import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { encryptJson } from "@cutura/core";

import { getDb } from "../getDb";
import { baseModel, order, orderItem } from "../schema";
import { findOrCreateCustomer } from "./auth";
import { buildReorderLine, getOrderItemConfigForCustomer } from "./reorder";

const db = () => getDb(env.TARGET_TEST_DB);
const KEY = "test-measurement-encryption-key";
const iso = "2026-06-24T10:00:00.000Z";

function sampleConfig() {
  return {
    baseModelName: "Oxford White",
    fabricCode: "oxf-white",
    configuration: { collar: "kent" },
    upgrades: [{ code: "monogram", placement: "cuff", priceMinor: 1500 }],
    garmentType: "shirt",
    measurementMethod: "wizard",
    measurementProfileVersion: 3,
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
    override: { chest: 1 },
    price: { base: 12900, fabric: 0, options: 0, upgrades: 1500, total: 14400 },
  };
}

async function seed(customerId: string): Promise<{ itemId: string; handle: string }> {
  const bmId = crypto.randomUUID();
  const handle = `oxf-${bmId.slice(0, 8)}`;
  await db()
    .insert(baseModel)
    .values({
      id: bmId,
      garmentTypeId: "gt",
      handle,
      nameI18n: { de: "Oxford" },
      descriptionI18n: null,
      basePriceMinor: 12900,
      leadTimeMinDays: 21,
      leadTimeMaxDays: 35,
      status: "orderable",
      attributes: null,
      createdAt: iso,
      updatedAt: iso,
    });
  const orderId = crypto.randomUUID();
  await db().insert(order).values({
    id: orderId,
    orderNumber: orderId,
    customerId,
    totalMinor: 14400,
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
      baseModelId: bmId,
      status: "shipped",
      configEnc: await encryptJson(sampleConfig(), KEY, "snapshot"),
      createdAt: iso,
      updatedAt: iso,
    });
  return { itemId, handle };
}

describe("reorder", () => {
  it("builds a keep line from the source config", async () => {
    const { customer } = await findOrCreateCustomer(db(), `r_${crypto.randomUUID()}@x.ch`, "de");
    const { itemId, handle } = await seed(customer.id);
    const line = await buildReorderLine(db(), customer.id, itemId, "keep", undefined, KEY);
    expect(line?.handle).toBe(handle);
    expect(line?.fabricCode).toBe("oxf-white");
    expect(line?.optionValueCodes).toEqual(["kent"]);
    expect(line?.upgradeCodes).toEqual(["monogram"]);
    expect(line?.perPieceOverride).toBeUndefined();
    expect(line?.reorder).toEqual({ sourceOrderItemId: itemId, mode: "keep" });
  });

  it("carries the new deltas for override mode", async () => {
    const { customer } = await findOrCreateCustomer(db(), `r_${crypto.randomUUID()}@x.ch`, "de");
    const { itemId } = await seed(customer.id);
    const line = await buildReorderLine(db(), customer.id, itemId, "override", { chest: 2 }, KEY);
    expect(line?.perPieceOverride).toEqual({ chest: 2 });
    expect(line?.reorder.mode).toBe("override");
  });

  it("decrypts the source config + rejects a non-owner", async () => {
    const { customer } = await findOrCreateCustomer(db(), `r_${crypto.randomUUID()}@x.ch`, "de");
    const { customer: other } = await findOrCreateCustomer(
      db(),
      `o_${crypto.randomUUID()}@x.ch`,
      "de",
    );
    const { itemId } = await seed(customer.id);
    const cfg = await getOrderItemConfigForCustomer(db(), customer.id, itemId, KEY);
    expect(cfg?.baseModelName).toBe("Oxford White");
    expect(await getOrderItemConfigForCustomer(db(), other.id, itemId, KEY)).toBeNull();
    expect(await buildReorderLine(db(), other.id, itemId, "keep", undefined, KEY)).toBeNull();
  });
});
