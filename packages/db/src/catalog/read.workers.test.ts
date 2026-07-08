import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { getDb } from "../getDb";
import {
  baseModel,
  collection,
  collectionMember,
  fabric,
  garmentType,
  modelAllowedFabric,
  modelAllowedOption,
  optionGroup,
  optionValue,
} from "../schema";
import { publishEntity } from "../publish";
import { getPublishedModel, listPublishedCollections, listPublishedModels } from "./read";

const control = () => getDb(env.CONTROL_TEST_DB);
const target = () => getDb(env.TARGET_TEST_DB);
const TS = "2026-06-24T00:00:00Z";

async function seedAndPublish(): Promise<{ handle: string }> {
  const p = crypto.randomUUID().slice(0, 8);
  const ids = {
    gt: `gt_${p}`,
    f1: `f1_${p}`,
    og: `og_${p}`,
    ov: `ov_${p}`,
    m: `m_${p}`,
    col: `col_${p}`,
  };
  const c = control();
  await c
    .insert(garmentType)
    .values({ id: ids.gt, key: ids.gt, nameI18n: { de: "Hemd" }, createdAt: TS, updatedAt: TS });
  await c.insert(fabric).values({
    id: ids.f1,
    code: `OXF-${p}`,
    nameI18n: { de: "Oxford Weiss", en: "Oxford White" },
    material: "Cotton poplin",
    fibreComposition: { cotton: 100 },
    careData: ["Machine wash 30", "Warm iron"],
    weightGsm: 120,
    surchargeMinor: 2000,
    available: true,
    createdAt: TS,
    updatedAt: TS,
  });
  await c.insert(optionGroup).values({
    id: ids.og,
    garmentTypeId: ids.gt,
    code: "collar",
    labelI18n: { de: "Kragen", en: "Collar" },
    createdAt: TS,
    updatedAt: TS,
  });
  await c.insert(optionValue).values({
    id: ids.ov,
    optionGroupId: ids.og,
    code: "spread",
    labelI18n: { de: "Spread", en: "Spread" },
    surchargeMinor: 500,
    createdAt: TS,
    updatedAt: TS,
  });
  await c.insert(baseModel).values({
    id: ids.m,
    garmentTypeId: ids.gt,
    handle: `oxford-${p}`,
    nameI18n: { de: "Oxford Business", en: "Oxford Business" },
    basePriceMinor: 12900,
    leadTimeMinDays: 21,
    leadTimeMaxDays: 35,
    status: "orderable",
    createdAt: TS,
    updatedAt: TS,
  });
  await c
    .insert(modelAllowedFabric)
    .values({ id: `${ids.m}-f1`, baseModelId: ids.m, fabricId: ids.f1, position: 0 });
  await c.insert(modelAllowedOption).values({
    id: `${ids.m}-og`,
    baseModelId: ids.m,
    optionGroupId: ids.og,
    required: true,
    position: 0,
  });
  await c.insert(collection).values({
    id: ids.col,
    handle: `featured-${p}`,
    nameI18n: { de: "Empfohlen", en: "Featured" },
    createdAt: TS,
    updatedAt: TS,
  });
  await c
    .insert(collectionMember)
    .values({ id: `${ids.col}-m`, collectionId: ids.col, baseModelId: ids.m, position: 0 });

  const opts = {
    control: control(),
    target: target(),
    environment: "staging" as const,
    publishedBy: "admin",
  };
  await publishEntity("baseModel", ids.m, opts);
  await publishEntity("collection", ids.col, opts);
  return { handle: `oxford-${p}` };
}

describe("storefront catalog read", () => {
  it("returns a published model with resolved allow-lists, localized", async () => {
    const { handle } = await seedAndPublish();
    const model = await getPublishedModel(target(), handle, "en");
    expect(model).toBeDefined();
    expect(model?.name).toBe("Oxford Business");
    expect(model?.fabrics).toHaveLength(1);
    expect(model?.fabrics[0]?.name).toBe("Oxford White");
    // Fabric-as-hero detail is surfaced to the storefront (fibre/weight on the tile,
    // material/care in the selected state), formatted server-side.
    expect(model?.fabrics[0]?.fibre).toBe("100% cotton");
    expect(model?.fabrics[0]?.weightGsm).toBe(120);
    expect(model?.fabrics[0]?.material).toBe("Cotton poplin");
    expect(model?.fabrics[0]?.care).toBe("Machine wash 30, Warm iron");
    expect(model?.optionGroups).toHaveLength(1);
    expect(model?.optionGroups[0]?.values[0]?.code).toBe("spread");
    expect(model?.upgrades).toHaveLength(0);
  });

  it("falls back to German when a locale is missing", async () => {
    const { handle } = await seedAndPublish();
    const model = await getPublishedModel(target(), handle, "fr");
    expect(model?.name).toBe("Oxford Business");
  });

  it("lists published models and collections", async () => {
    const { handle } = await seedAndPublish();
    const models = await listPublishedModels(target(), "de");
    expect(models.some((m) => m.handle === handle)).toBe(true);

    const collections = await listPublishedCollections(target(), "de");
    const featured = collections.find((col) => col.modelHandles.includes(handle));
    expect(featured).toBeDefined();
  });

  it("returns undefined for an unknown handle", async () => {
    expect(await getPublishedModel(target(), "does-not-exist", "de")).toBeUndefined();
  });
});
