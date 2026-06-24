import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { encryptJson } from "@cutura/core";

import { getDb } from "../getDb";
import { order, orderItem } from "../schema";
import { getPipelineBoard } from "./board";

const db = () => getDb(env.TARGET_TEST_DB);
const KEY = "test-measurement-encryption-key";
const iso = "2026-07-05T10:00:00.000Z";

function config(chest: number) {
  return {
    baseModelName: "Oxford",
    fabricCode: "oxf",
    configuration: { collar: "kent" },
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

async function seed(chest: number, status: string): Promise<string> {
  const orderId = crypto.randomUUID();
  await db().insert(order).values({
    id: orderId,
    orderNumber: orderId,
    totalMinor: 12900,
    acceptedTermsVersion: "v1",
    acceptedPrivacyVersion: "v1",
    status,
    createdAt: iso,
    updatedAt: iso,
  });
  await db()
    .insert(orderItem)
    .values({
      id: crypto.randomUUID(),
      orderId,
      baseModelId: "bm1",
      status,
      configEnc: await encryptJson(config(chest), KEY, "snapshot"),
      createdAt: iso,
      updatedAt: iso,
    });
  return orderId;
}

describe("getPipelineBoard", () => {
  it("flags outlier orders and groups by status", async () => {
    const outlierId = await seed(200, "in_review"); // chest 200 -> outlier
    const normalId = await seed(100, "in_review"); // normal
    const board = await getPipelineBoard(db(), KEY);

    const outlier = board.find((o) => o.id === outlierId);
    const normal = board.find((o) => o.id === normalId);
    expect(outlier?.outlier).toBe(true);
    expect(outlier?.outlierFlags.length).toBeGreaterThan(0);
    expect(normal?.outlier).toBe(false);
    expect(outlier?.status).toBe("in_review");
  });
});
