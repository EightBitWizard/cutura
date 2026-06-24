import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { getDb } from "../getDb";
import { fitFeedback, order } from "../schema";
import { findOrCreateCustomer } from "./auth";
import { submitFitFeedback } from "./fitFeedback";

const db = () => getDb(env.TARGET_TEST_DB);
const iso = "2026-06-24T10:00:00.000Z";

async function seedOrder(customerId: string): Promise<string> {
  const id = crypto.randomUUID();
  await db().insert(order).values({
    id,
    orderNumber: id,
    customerId,
    totalMinor: 12900,
    acceptedTermsVersion: "v1",
    acceptedPrivacyVersion: "v1",
    status: "shipped",
    createdAt: iso,
    updatedAt: iso,
  });
  return id;
}

describe("submitFitFeedback", () => {
  it("records feedback for the owner and rejects a non-owner", async () => {
    const { customer } = await findOrCreateCustomer(db(), `fb_${crypto.randomUUID()}@x.ch`, "de");
    const orderId = await seedOrder(customer.id);
    const res = await submitFitFeedback(db(), {
      customerId: customer.id,
      orderId,
      overallRating: 4,
      notes: "Slightly long sleeves",
      wantsRemake: false,
    });
    expect(res).not.toBeNull();
    const [row] = await db().select().from(fitFeedback).where(eq(fitFeedback.orderId, orderId));
    expect(row?.overallRating).toBe(4);

    const { customer: other } = await findOrCreateCustomer(
      db(),
      `o_${crypto.randomUUID()}@x.ch`,
      "de",
    );
    expect(
      await submitFitFeedback(db(), { customerId: other.id, orderId, overallRating: 5 }),
    ).toBeNull();
  });
});
