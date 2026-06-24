import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { getDb } from "../getDb";
import {
  attributeDefinition,
  attributeValue,
  baseModel,
  crossSellRule,
  order,
  orderItem,
} from "../schema";
import { getRecommendations } from "./index";

const db = () => getDb(env.TARGET_TEST_DB);
const iso = "2026-06-24T10:00:00.000Z";

async function model(id: string, handle: string, status: "orderable" | "view_only" = "orderable") {
  await db()
    .insert(baseModel)
    .values({
      id,
      garmentTypeId: "gt_shirt",
      handle,
      nameI18n: { de: handle, en: handle },
      basePriceMinor: 12900,
      leadTimeMinDays: 21,
      leadTimeMaxDays: 35,
      status,
      createdAt: iso,
      updatedAt: iso,
    });
}

async function attr(defId: string, key: string) {
  await db()
    .insert(attributeDefinition)
    .values({
      id: defId,
      key,
      labelI18n: { de: key },
      appliesTo: "model",
      createdAt: iso,
      updatedAt: iso,
    });
}

async function setAttr(defId: string, modelId: string, value: string) {
  await db().insert(attributeValue).values({
    id: crypto.randomUUID(),
    attributeDefinitionId: defId,
    entityType: "model",
    entityId: modelId,
    value,
  });
}

describe("getRecommendations", () => {
  it("ranks by shared attributes, blends curated cross-sell, excludes source + owned", async () => {
    const tag = crypto.randomUUID().slice(0, 6);
    const [m1, m2, m3, m4] = [`s1_${tag}`, `s2_${tag}`, `s3_${tag}`, `s4_${tag}`];
    await model(m1, `h1_${tag}`);
    await model(m2, `h2_${tag}`);
    await model(m3, `h3_${tag}`);
    await model(m4, `h4_${tag}`);

    const occ = `occ_${tag}`;
    await attr(occ, occ);
    await setAttr(occ, m1, "business"); // source
    await setAttr(occ, m2, "business"); // shares with source
    await setAttr(occ, m3, "casual"); // no shared attr (but will be curated)
    await setAttr(occ, m4, "business"); // shares, but will be owned -> excluded

    // Curated cross-sell from m1 -> m3.
    await db()
      .insert(crossSellRule)
      .values({
        id: `x_${tag}`,
        sourceType: "model",
        sourceKey: `h1_${tag}`,
        suggestedModelId: m3,
        position: 0,
        createdAt: iso,
        updatedAt: iso,
      });

    // A customer who already ordered m4.
    const customerId = `c_${tag}`;
    const orderId = `o_${tag}`;
    await db().insert(order).values({
      id: orderId,
      orderNumber: orderId,
      customerId,
      totalMinor: 12900,
      acceptedTermsVersion: "2026-06-24",
      acceptedPrivacyVersion: "2026-06-24",
      status: "new",
      createdAt: iso,
      updatedAt: iso,
    });
    await db()
      .insert(orderItem)
      .values({
        id: `oi_${tag}`,
        orderId,
        baseModelId: m4,
        status: "new",
        configEnc: "x",
        createdAt: iso,
        updatedAt: iso,
      });

    const recs = await getRecommendations(db(), "de", {
      sourceModelIds: [m1],
      customerId,
      limit: 4,
    });
    const ids = recs.map((r) => r.id);

    expect(ids).not.toContain(m1); // source excluded
    expect(ids).not.toContain(m4); // owned excluded
    // m3 is curated (first), m2 shares occasion=business (next).
    expect(ids).toEqual([m3, m2]);
  });

  it("returns an orderable catalog baseline with no context", async () => {
    const tag = crypto.randomUUID().slice(0, 6);
    const id = `n_${tag}`;
    await model(id, `hn_${tag}`);
    const recs = await getRecommendations(db(), "de", { limit: 20 });
    expect(recs.some((r) => r.id === id)).toBe(true);
  });
});
