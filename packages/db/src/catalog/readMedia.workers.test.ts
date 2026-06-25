import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { getDb } from "../getDb";
import {
  baseModel,
  fabric,
  garmentType,
  media,
  modelAllowedFabric,
  modelAllowedOption,
  modelAllowedUpgrade,
  optionGroup,
  optionValue,
  upgrade,
} from "../schema";
import { publishEntity } from "../publish";
import { getPublishedModel } from "./read";

const control = () => getDb(env.CONTROL_TEST_DB);
const target = () => getDb(env.TARGET_TEST_DB);
const TS = "2026-06-25T00:00:00Z";

// Seeds a model whose fabric, option value, and upgrade each carry a primary image,
// plus a second fabric with no image, then publishes the model.
async function seedWithMedia() {
  const p = crypto.randomUUID().slice(0, 8);
  const ids = {
    gt: `gt_${p}`,
    f1: `f1_${p}`,
    f2: `f2_${p}`,
    og: `og_${p}`,
    ov: `ov_${p}`,
    up: `up_${p}`,
    m: `m_${p}`,
    mf1: `mf1_${p}`,
    mf2: `mf2_${p}`,
    fMedia: `med_f_${p}`,
    ovMedia: `med_ov_${p}`,
    upMedia: `med_up_${p}`,
  };
  const c = control();
  await c
    .insert(garmentType)
    .values({ id: ids.gt, key: ids.gt, nameI18n: { de: "Hemd" }, createdAt: TS, updatedAt: TS });
  await c.insert(fabric).values([
    {
      id: ids.f1,
      code: `OXF-${p}`,
      nameI18n: { de: "Oxford" },
      surchargeMinor: 0,
      available: true,
      createdAt: TS,
      updatedAt: TS,
    },
    {
      id: ids.f2,
      code: `LIN-${p}`,
      nameI18n: { de: "Leinen" },
      surchargeMinor: 0,
      available: true,
      createdAt: TS,
      updatedAt: TS,
    },
  ]);
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
    surchargeMinor: 0,
    createdAt: TS,
    updatedAt: TS,
  });
  await c.insert(upgrade).values({
    id: ids.up,
    code: `monogram-${p}`,
    nameI18n: { de: "Monogramm" },
    priceMinor: 1500,
    createdAt: TS,
    updatedAt: TS,
  });
  // Primary images on the fabric, the option value, and the upgrade.
  await c.insert(media).values([
    {
      id: ids.fMedia,
      r2Key: `media/fabric/${ids.f1}/${ids.fMedia}`,
      entityType: "fabric",
      entityId: ids.f1,
      position: 0,
      isPrimary: true,
      createdAt: TS,
      updatedAt: TS,
    },
    {
      id: ids.ovMedia,
      r2Key: `media/optionValue/${ids.ov}/${ids.ovMedia}`,
      entityType: "optionValue",
      entityId: ids.ov,
      position: 0,
      isPrimary: true,
      createdAt: TS,
      updatedAt: TS,
    },
    {
      id: ids.upMedia,
      r2Key: `media/upgrade/${ids.up}/${ids.upMedia}`,
      entityType: "upgrade",
      entityId: ids.up,
      position: 0,
      isPrimary: true,
      createdAt: TS,
      updatedAt: TS,
    },
  ]);
  await c.insert(baseModel).values({
    id: ids.m,
    garmentTypeId: ids.gt,
    handle: `oxford-${p}`,
    nameI18n: { de: "Oxford Business" },
    basePriceMinor: 12900,
    leadTimeMinDays: 21,
    leadTimeMaxDays: 35,
    status: "orderable",
    createdAt: TS,
    updatedAt: TS,
  });
  await c.insert(modelAllowedFabric).values([
    { id: ids.mf1, baseModelId: ids.m, fabricId: ids.f1, position: 0 },
    { id: ids.mf2, baseModelId: ids.m, fabricId: ids.f2, position: 1 },
  ]);
  await c.insert(modelAllowedOption).values({
    id: `${ids.m}-og`,
    baseModelId: ids.m,
    optionGroupId: ids.og,
    required: true,
    position: 0,
  });
  await c
    .insert(modelAllowedUpgrade)
    .values({ id: `${ids.m}-up`, baseModelId: ids.m, upgradeId: ids.up, position: 0 });

  await publishEntity("baseModel", ids.m, {
    control: control(),
    target: target(),
    environment: "staging",
    publishedBy: "admin",
  });
  return { handle: `oxford-${p}`, ids };
}

describe("getPublishedModel attaches primary media ids", () => {
  it("attaches the fabric, option value, and upgrade primary media ids", async () => {
    const { handle, ids } = await seedWithMedia();
    const model = await getPublishedModel(target(), handle, "de");
    expect(model).toBeDefined();
    expect(model?.fabrics[0]?.mediaId).toBe(ids.fMedia);
    expect(model?.optionGroups[0]?.values[0]?.mediaId).toBe(ids.ovMedia);
    expect(model?.upgrades[0]?.mediaId).toBe(ids.upMedia);
  });

  it("uses null when an entity has no image", async () => {
    const { handle } = await seedWithMedia();
    const model = await getPublishedModel(target(), handle, "de");
    // The second fabric (Leinen) carries no media.
    const linen = model?.fabrics.find((f) => f.name === "Leinen");
    expect(linen?.mediaId).toBeNull();
  });

  it("publishes option group and option value media rows to the target", async () => {
    const { ids } = await seedWithMedia();
    const groupMedia = await target()
      .select()
      .from(media)
      .where(eq(media.entityType, "optionValue"));
    expect(groupMedia.some((m) => m.id === ids.ovMedia)).toBe(true);
  });
});
