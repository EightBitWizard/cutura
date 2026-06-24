import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { getDb } from "../getDb";
import { publishEntity } from "../publish";
import { baseModel, crossSellRule } from "../schema";
import { createCrossSellRule, getCrossSellSuggestions } from "./index";

const control = () => getDb(env.CONTROL_TEST_DB);
const target = () => getDb(env.TARGET_TEST_DB);
const iso = "2026-07-05T10:00:00.000Z";

async function model(db: ReturnType<typeof getDb>, handle: string): Promise<string> {
  const id = crypto.randomUUID();
  await db.insert(baseModel).values({
    id,
    garmentTypeId: "gt",
    handle,
    nameI18n: { de: handle },
    descriptionI18n: null,
    basePriceMinor: 10000,
    leadTimeMinDays: 21,
    leadTimeMaxDays: 35,
    status: "orderable",
    attributes: null,
    createdAt: iso,
    updatedAt: iso,
  });
  return id;
}

describe("cross-sell", () => {
  it("returns curated suggestions for a source model, excluding itself", async () => {
    const handle = `shirt-${crypto.randomUUID().slice(0, 6)}`;
    const source = await model(target(), handle);
    const suggested = await model(target(), `trouser-${crypto.randomUUID().slice(0, 6)}`);
    await createCrossSellRule(target(), {
      sourceType: "model",
      sourceKey: handle,
      suggestedModelId: suggested,
    });
    const s = await getCrossSellSuggestions(target(), "de", { id: source, handle });
    expect(s.map((x) => x.id)).toContain(suggested);
    expect(s.map((x) => x.id)).not.toContain(source);
  });

  it("publishes a rule from control to the env DB", async () => {
    const handle = `s-${crypto.randomUUID().slice(0, 6)}`;
    const suggested = await model(control(), `t-${crypto.randomUUID().slice(0, 6)}`);
    const { id } = await createCrossSellRule(control(), {
      sourceType: "model",
      sourceKey: handle,
      suggestedModelId: suggested,
    });
    await publishEntity("crossSellRule", id, {
      control: control(),
      target: target(),
      environment: "staging",
      publishedBy: "admin",
    });
    const [row] = await target().select().from(crossSellRule).where(eq(crossSellRule.id, id));
    expect(row?.sourceKey).toBe(handle);
  });
});
