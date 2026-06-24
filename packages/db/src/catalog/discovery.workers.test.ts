import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { getDb } from "../getDb";
import { attributeDefinition, attributeValue, baseModel } from "../schema";
import { listAttributeFacets, listPublishedModelsFiltered } from "./read";

const db = () => getDb(env.TARGET_TEST_DB);
const iso = "2026-07-05T10:00:00.000Z";

async function model(name: string, price: number): Promise<string> {
  const id = crypto.randomUUID();
  await db()
    .insert(baseModel)
    .values({
      id,
      garmentTypeId: "gt",
      handle: `h-${id.slice(0, 8)}`,
      nameI18n: { de: name },
      descriptionI18n: null,
      basePriceMinor: price,
      leadTimeMinDays: 21,
      leadTimeMaxDays: 35,
      status: "orderable",
      attributes: null,
      createdAt: iso,
      updatedAt: iso,
    });
  return id;
}

async function attr(modelId: string, defId: string, value: string): Promise<void> {
  await db().insert(attributeValue).values({
    id: crypto.randomUUID(),
    attributeDefinitionId: defId,
    entityType: "model",
    entityId: modelId,
    value,
  });
}

describe("discovery", () => {
  it("filters by attribute and sorts by price, and builds facets", async () => {
    const defId = crypto.randomUUID();
    const key = `colour_${defId.slice(0, 6)}`;
    await db()
      .insert(attributeDefinition)
      .values({
        id: defId,
        key,
        labelI18n: { de: "Farbe" },
        appliesTo: "model",
        createdAt: iso,
        updatedAt: iso,
      });
    const blue = await model("Blue Shirt", 12900);
    const red = await model("Red Shirt", 9900);
    await attr(blue, defId, "blue");
    await attr(red, defId, "red");

    const facet = (await listAttributeFacets(db(), "de")).find((f) => f.key === key);
    expect(facet?.values.find((v) => v.value === "blue")?.count).toBe(1);

    const filtered = await listPublishedModelsFiltered(db(), "de", {
      attributes: { [key]: ["blue"] },
    });
    expect(filtered.map((m) => m.id)).toContain(blue);
    expect(filtered.map((m) => m.id)).not.toContain(red);

    const sorted = await listPublishedModelsFiltered(db(), "de", {
      attributes: { [key]: ["blue", "red"] },
      sort: "price_asc",
    });
    const idx = (id: string) => sorted.findIndex((m) => m.id === id);
    expect(idx(red)).toBeLessThan(idx(blue)); // 9900 before 12900
  });
});
