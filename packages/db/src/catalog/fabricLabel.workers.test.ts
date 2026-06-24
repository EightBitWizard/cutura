import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { getDb } from "../getDb";
import { fabric } from "../schema";
import { getFabricSewnInLabel } from "./read";

const db = () => getDb(env.TARGET_TEST_DB);
const iso = "2026-07-05T10:00:00.000Z";

describe("getFabricSewnInLabel", () => {
  it("formats composition (record) + care (array), empty for unknown", async () => {
    const code = `fab-${crypto.randomUUID().slice(0, 6)}`;
    await db()
      .insert(fabric)
      .values({
        id: crypto.randomUUID(),
        code,
        nameI18n: { de: "Oxford" },
        surchargeMinor: 0,
        available: true,
        fibreComposition: { cotton: 100 },
        careData: ["30C", "no bleach"],
        createdAt: iso,
        updatedAt: iso,
      });
    expect(await getFabricSewnInLabel(db(), code)).toEqual({
      composition: "100% cotton",
      care: "30C, no bleach",
    });
    expect(await getFabricSewnInLabel(db(), "missing")).toEqual({});
  });
});
