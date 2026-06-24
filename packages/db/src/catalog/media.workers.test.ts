import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { getDb } from "../getDb";
import { media } from "../schema";
import { getPrimaryMediaId, primaryMediaForEntities } from "./read";

const db = () => getDb(env.TARGET_TEST_DB);
const iso = "2026-07-05T10:00:00.000Z";

async function addMedia(entityId: string, position: number, isPrimary: boolean): Promise<string> {
  const id = crypto.randomUUID();
  await db()
    .insert(media)
    .values({
      id,
      r2Key: `k/${id}`,
      entityType: "model",
      entityId,
      position,
      isPrimary,
      createdAt: iso,
      updatedAt: iso,
    });
  return id;
}

describe("media read helpers", () => {
  it("returns the primary id (flag first, then lowest position)", async () => {
    const model = crypto.randomUUID();
    await addMedia(model, 0, false);
    const primary = await addMedia(model, 5, true);
    expect(await getPrimaryMediaId(db(), "model", model)).toBe(primary);
    expect(await getPrimaryMediaId(db(), "model", "none")).toBeNull();
  });

  it("maps many entities to their primary in one query", async () => {
    const a = crypto.randomUUID();
    const b = crypto.randomUUID();
    const aFirst = await addMedia(a, 0, false);
    await addMedia(a, 1, false);
    const bPrimary = await addMedia(b, 9, true);
    const map = await primaryMediaForEntities(db(), "model", [a, b, "missing"]);
    expect(map.get(a)).toBe(aFirst); // lowest position
    expect(map.get(b)).toBe(bPrimary); // primary flag wins
    expect(map.has("missing")).toBe(false);
  });
});
