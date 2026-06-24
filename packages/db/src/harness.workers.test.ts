import { eq } from "drizzle-orm";
import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { getDb } from "./getDb";
import { garmentType } from "./schema";

// Validates the Workers-pool harness: migrations applied to the test D1 and a
// Drizzle round-trip against real D1.
describe("workers-pool D1 harness", () => {
  it("applies migrations and round-trips a row via Drizzle", async () => {
    const db = getDb(env.CONTROL_TEST_DB);
    await db.insert(garmentType).values({
      id: "gt_harness",
      key: "harness",
      nameI18n: { de: "Test" },
      createdAt: "2026-06-24T00:00:00Z",
      updatedAt: "2026-06-24T00:00:00Z",
    });
    const rows = await db.select().from(garmentType).where(eq(garmentType.id, "gt_harness"));
    expect(rows).toHaveLength(1);
    expect(rows[0]!.key).toBe("harness");
    expect(rows[0]!.nameI18n).toEqual({ de: "Test" });
  });
});
