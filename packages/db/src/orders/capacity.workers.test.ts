import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { getDb } from "../getDb";
import { order } from "../schema";
import { countOpenOrders } from "./read";

const db = () => getDb(env.TARGET_TEST_DB);
const iso = "2026-07-05T10:00:00.000Z";

async function seed(status: string): Promise<void> {
  const id = crypto.randomUUID();
  await db().insert(order).values({
    id,
    orderNumber: id,
    totalMinor: 1000,
    acceptedTermsVersion: "v1",
    acceptedPrivacyVersion: "v1",
    status,
    createdAt: iso,
    updatedAt: iso,
  });
}

describe("countOpenOrders", () => {
  it("counts all orders that are not shipped", async () => {
    const before = await countOpenOrders(db());
    await seed("in_review");
    await seed("in_production");
    await seed("shipped");
    expect(await countOpenOrders(db())).toBe(before + 2);
  });
});
