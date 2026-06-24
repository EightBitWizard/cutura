import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { getDb } from "../getDb";
import { baseModel, collection, collectionMember } from "../schema";
import { getPublishedCollection } from "./read";

const db = () => getDb(env.TARGET_TEST_DB);
const iso = "2026-07-05T10:00:00.000Z";

async function model(name: string, status: "draft" | "view_only" | "orderable"): Promise<string> {
  const id = crypto.randomUUID();
  await db()
    .insert(baseModel)
    .values({
      id,
      garmentTypeId: "gt",
      handle: `h-${id.slice(0, 8)}`,
      nameI18n: { de: name },
      descriptionI18n: null,
      basePriceMinor: 10000,
      leadTimeMinDays: 21,
      leadTimeMaxDays: 35,
      status,
      attributes: null,
      createdAt: iso,
      updatedAt: iso,
    });
  return id;
}

describe("getPublishedCollection", () => {
  it("returns ordered non-draft members + banner, null for unknown", async () => {
    const first = await model("First", "orderable");
    const second = await model("Second", "orderable");
    const draft = await model("Draft", "draft");
    const colId = crypto.randomUUID();
    const handle = `col-${colId.slice(0, 6)}`;
    await db()
      .insert(collection)
      .values({
        id: colId,
        handle,
        nameI18n: { de: "Sommer" },
        descriptionI18n: null,
        bannerMediaId: "banner-1",
        createdAt: iso,
        updatedAt: iso,
      });
    // Insert members out of order; position drives the result order.
    await db()
      .insert(collectionMember)
      .values({ id: crypto.randomUUID(), collectionId: colId, baseModelId: second, position: 1 });
    await db()
      .insert(collectionMember)
      .values({ id: crypto.randomUUID(), collectionId: colId, baseModelId: first, position: 0 });
    await db()
      .insert(collectionMember)
      .values({ id: crypto.randomUUID(), collectionId: colId, baseModelId: draft, position: 2 });

    const col = await getPublishedCollection(db(), handle, "de");
    expect(col?.bannerMediaId).toBe("banner-1");
    expect(col?.models.map((m) => m.id)).toEqual([first, second]); // ordered, draft excluded
    expect(await getPublishedCollection(db(), "missing", "de")).toBeNull();
  });
});
