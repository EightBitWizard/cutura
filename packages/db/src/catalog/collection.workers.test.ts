import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { getDb } from "../getDb";
import { baseModel, collection, collectionMember } from "../schema";
import { getPublishedCollection, listLandingCollections } from "./read";

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

describe("listLandingCollections", () => {
  it("returns only featured collections, ordered by landingPosition, members ordered + capped at 3 (no drafts)", async () => {
    const [a1, a2, a3, a4] = [
      await model("A1", "orderable"),
      await model("A2", "orderable"),
      await model("A3", "orderable"),
      await model("A4", "orderable"),
    ];
    const aDraft = await model("ADraft", "draft");
    const b1 = await model("B1", "orderable");

    const businessId = crypto.randomUUID();
    const businessHandle = `business-${businessId.slice(0, 6)}`;
    await db()
      .insert(collection)
      .values({
        id: businessId,
        handle: businessHandle,
        nameI18n: { de: "Business" },
        descriptionI18n: { de: "Beschrieb" },
        bannerMediaId: "banner-feat",
        featuredOnLanding: true,
        landingPosition: 2,
        createdAt: iso,
        updatedAt: iso,
      });
    await db()
      .insert(collectionMember)
      .values([
        { id: crypto.randomUUID(), collectionId: businessId, baseModelId: a2, position: 1 },
        { id: crypto.randomUUID(), collectionId: businessId, baseModelId: a1, position: 0 },
        { id: crypto.randomUUID(), collectionId: businessId, baseModelId: a3, position: 2 },
        { id: crypto.randomUUID(), collectionId: businessId, baseModelId: a4, position: 3 },
        { id: crypto.randomUUID(), collectionId: businessId, baseModelId: aDraft, position: 4 },
      ]);

    // A second featured collection with a lower landingPosition -> sorts before Business.
    const casualId = crypto.randomUUID();
    const casualHandle = `casual-${casualId.slice(0, 6)}`;
    await db()
      .insert(collection)
      .values({
        id: casualId,
        handle: casualHandle,
        nameI18n: { de: "Casual" },
        descriptionI18n: null,
        bannerMediaId: null,
        featuredOnLanding: true,
        landingPosition: 1,
        createdAt: iso,
        updatedAt: iso,
      });
    await db()
      .insert(collectionMember)
      .values({ id: crypto.randomUUID(), collectionId: casualId, baseModelId: b1, position: 0 });

    // A non-featured collection -> excluded from the landing list.
    const hiddenId = crypto.randomUUID();
    const hiddenHandle = `hidden-${hiddenId.slice(0, 6)}`;
    await db()
      .insert(collection)
      .values({
        id: hiddenId,
        handle: hiddenHandle,
        nameI18n: { de: "Hidden" },
        descriptionI18n: null,
        bannerMediaId: null,
        featuredOnLanding: false,
        landingPosition: 0,
        createdAt: iso,
        updatedAt: iso,
      });

    const landing = await listLandingCollections(db(), "de");
    const handles = landing.map((c) => c.handle);
    expect(handles).toContain(businessHandle);
    expect(handles).toContain(casualHandle);
    expect(handles).not.toContain(hiddenHandle);
    // Ordered by landingPosition: Casual (1) before Business (2).
    expect(handles.indexOf(casualHandle)).toBeLessThan(handles.indexOf(businessHandle));

    const business = landing.find((c) => c.handle === businessHandle)!;
    expect(business.name).toBe("Business");
    expect(business.description).toBe("Beschrieb");
    expect(business.bannerMediaId).toBe("banner-feat");
    // Members ordered by position, draft excluded, capped at 3.
    expect(business.models.map((m) => m.id)).toEqual([a1, a2, a3]);
  });
});
