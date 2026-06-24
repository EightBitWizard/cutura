import { eq } from "drizzle-orm";
import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { getDb } from "../getDb";
import {
  baseModel,
  fabric,
  garmentType,
  modelAllowedFabric,
  modelAllowedOption,
  optionGroup,
  optionValue,
  publication,
} from "../schema";
import { publishEntity, unpublishEntity } from "./index";

const control = () => getDb(env.CONTROL_TEST_DB);
const target = () => getDb(env.TARGET_TEST_DB);
const prod = () => getDb(env.PROD_TEST_DB);

const TS = "2026-06-24T00:00:00Z";

interface Ids {
  gt: string;
  f1: string;
  f2: string;
  og: string;
  ov: string;
  m: string;
}

function makeIds(): Ids {
  const p = crypto.randomUUID().slice(0, 8);
  return { gt: `gt_${p}`, f1: `f1_${p}`, f2: `f2_${p}`, og: `og_${p}`, ov: `ov_${p}`, m: `m_${p}` };
}

async function seedModel(ids: Ids): Promise<void> {
  const c = control();
  await c
    .insert(garmentType)
    .values({ id: ids.gt, key: ids.gt, nameI18n: { de: "Hemd" }, createdAt: TS, updatedAt: TS });
  await c
    .insert(fabric)
    .values({ id: ids.f1, code: ids.f1, nameI18n: { de: "Weiss" }, createdAt: TS, updatedAt: TS });
  await c
    .insert(fabric)
    .values({ id: ids.f2, code: ids.f2, nameI18n: { de: "Blau" }, createdAt: TS, updatedAt: TS });
  await c.insert(optionGroup).values({
    id: ids.og,
    garmentTypeId: ids.gt,
    code: "collar",
    labelI18n: { de: "Kragen" },
    createdAt: TS,
    updatedAt: TS,
  });
  await c.insert(optionValue).values({
    id: ids.ov,
    optionGroupId: ids.og,
    code: "spread",
    labelI18n: { de: "Spread" },
    createdAt: TS,
    updatedAt: TS,
  });
  await c.insert(baseModel).values({
    id: ids.m,
    garmentTypeId: ids.gt,
    handle: ids.m,
    nameI18n: { de: "Oxford" },
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
  await c
    .insert(modelAllowedFabric)
    .values({ id: `${ids.m}-f2`, baseModelId: ids.m, fabricId: ids.f2, position: 1 });
  await c.insert(modelAllowedOption).values({
    id: `${ids.m}-og`,
    baseModelId: ids.m,
    optionGroupId: ids.og,
    required: true,
    position: 0,
  });
}

const publishOpts = (environment: "staging" | "production") => ({
  control: control(),
  target: target(),
  environment,
  publishedBy: "admin",
});

describe("publishEntity - baseModel closure", () => {
  it("copies the garment type, fabrics, options, allow-lists, and a publication row", async () => {
    const ids = makeIds();
    await seedModel(ids);
    await publishEntity("baseModel", ids.m, publishOpts("staging"));

    const t = target();
    expect(await t.select().from(baseModel).where(eq(baseModel.id, ids.m))).toHaveLength(1);
    expect(await t.select().from(garmentType).where(eq(garmentType.id, ids.gt))).toHaveLength(1);
    expect(await t.select().from(fabric).where(eq(fabric.id, ids.f1))).toHaveLength(1);
    expect(await t.select().from(fabric).where(eq(fabric.id, ids.f2))).toHaveLength(1);
    expect(
      await t.select().from(optionValue).where(eq(optionValue.optionGroupId, ids.og)),
    ).toHaveLength(1);
    expect(
      await t.select().from(modelAllowedFabric).where(eq(modelAllowedFabric.baseModelId, ids.m)),
    ).toHaveLength(2);
    expect(await t.select().from(publication).where(eq(publication.entityId, ids.m))).toHaveLength(
      1,
    );
  });

  it("is idempotent: re-publishing does not duplicate rows", async () => {
    const ids = makeIds();
    await seedModel(ids);
    await publishEntity("baseModel", ids.m, publishOpts("staging"));
    await publishEntity("baseModel", ids.m, publishOpts("staging"));

    const t = target();
    expect(await t.select().from(fabric).where(eq(fabric.id, ids.f1))).toHaveLength(1);
    expect(
      await t.select().from(modelAllowedFabric).where(eq(modelAllowedFabric.baseModelId, ids.m)),
    ).toHaveLength(2);
    expect(await t.select().from(publication).where(eq(publication.entityId, ids.m))).toHaveLength(
      1,
    );
  });

  it("drops a child removed in control on re-publish", async () => {
    const ids = makeIds();
    await seedModel(ids);
    await publishEntity("baseModel", ids.m, publishOpts("staging"));
    // remove one allowed fabric in control, then re-publish
    await control()
      .delete(modelAllowedFabric)
      .where(eq(modelAllowedFabric.id, `${ids.m}-f2`));
    await publishEntity("baseModel", ids.m, publishOpts("staging"));

    expect(
      await target()
        .select()
        .from(modelAllowedFabric)
        .where(eq(modelAllowedFabric.baseModelId, ids.m)),
    ).toHaveLength(1);
  });

  it("does not write the production database when publishing to staging", async () => {
    const ids = makeIds();
    await seedModel(ids);
    await publishEntity("baseModel", ids.m, publishOpts("staging"));
    expect(await prod().select().from(baseModel).where(eq(baseModel.id, ids.m))).toHaveLength(0);
  });
});

describe("unpublishEntity", () => {
  it("removes the model, its allow-lists, and the publication, but leaves shared fabrics", async () => {
    const ids = makeIds();
    await seedModel(ids);
    await publishEntity("baseModel", ids.m, publishOpts("staging"));
    await unpublishEntity("baseModel", ids.m, {
      target: target(),
      environment: "staging",
      publishedBy: "admin",
    });

    const t = target();
    expect(await t.select().from(baseModel).where(eq(baseModel.id, ids.m))).toHaveLength(0);
    expect(
      await t.select().from(modelAllowedFabric).where(eq(modelAllowedFabric.baseModelId, ids.m)),
    ).toHaveLength(0);
    expect(await t.select().from(publication).where(eq(publication.entityId, ids.m))).toHaveLength(
      0,
    );
    // shared leaf left in place
    expect(await t.select().from(fabric).where(eq(fabric.id, ids.f1))).toHaveLength(1);
  });
});

describe("publishEntity - fabric standalone", () => {
  it("publishes a fabric on its own with a publication row", async () => {
    const ids = makeIds();
    await seedModel(ids);
    await publishEntity("fabric", ids.f1, publishOpts("staging"));

    const t = target();
    expect(await t.select().from(fabric).where(eq(fabric.id, ids.f1))).toHaveLength(1);
    expect(await t.select().from(publication).where(eq(publication.entityId, ids.f1))).toHaveLength(
      1,
    );
  });
});
