import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { getDb } from "../getDb";
import { auditLog, fitReview, order, orderItem, productionPackage } from "../schema";
import { recordPreReleaseCorrection } from "./correction";
import { listFitReviews } from "./fitReviewQueue";

const db = () => getDb(env.TARGET_TEST_DB);
const iso = "2026-07-05T10:00:00.000Z";

async function seedOrderItem(status: string): Promise<{ orderId: string; itemId: string }> {
  const orderId = crypto.randomUUID();
  await db()
    .insert(order)
    .values({
      id: orderId,
      orderNumber: `ORD-${orderId.slice(0, 6)}`,
      totalMinor: 12900,
      acceptedTermsVersion: "v1",
      acceptedPrivacyVersion: "v1",
      status,
      createdAt: iso,
      updatedAt: iso,
    });
  const itemId = crypto.randomUUID();
  await db().insert(orderItem).values({
    id: itemId,
    orderId,
    baseModelId: "bm1",
    status,
    createdAt: iso,
    updatedAt: iso,
  });
  await db().insert(productionPackage).values({
    id: crypto.randomUUID(),
    orderItemId: itemId,
    garmentType: "shirt",
    supplierId: null,
    snapshotEnc: "x",
    createdAt: iso,
  });
  return { orderId, itemId };
}

describe("fit-review queue", () => {
  it("lists reviews with the order number + photo count, filtered by status", async () => {
    const { orderId } = await seedOrderItem("shipped");
    await db()
      .insert(fitReview)
      .values({
        id: crypto.randomUUID(),
        orderId,
        orderItemId: null,
        reason: "sleeves too long",
        photoR2Keys: ["a", "b"],
        status: "open",
        createdAt: iso,
        updatedAt: iso,
      });
    const open = await listFitReviews(db(), "open");
    const row = open.find((r) => r.orderId === orderId);
    expect(row?.reason).toBe("sleeves too long");
    expect(row?.photoCount).toBe(2);
    expect(
      (await listFitReviews(db(), "decided")).find((r) => r.orderId === orderId),
    ).toBeUndefined();
  });
});

describe("recordPreReleaseCorrection", () => {
  it("appends an audited note while in_review, rejects past review", async () => {
    const { itemId } = await seedOrderItem("in_review");
    expect(
      await recordPreReleaseCorrection(
        db(),
        { orderItemId: itemId, note: "use navy thread" },
        "admin",
      ),
    ).toBe(true);
    const [pkg] = await db()
      .select()
      .from(productionPackage)
      .where(eq(productionPackage.orderItemId, itemId));
    expect(pkg?.internalNotes).toContain("use navy thread");
    const audits = await db().select().from(auditLog).where(eq(auditLog.entityId, itemId));
    expect(audits.some((a) => a.action === "order.correction")).toBe(true);

    const past = await seedOrderItem("approved");
    expect(
      await recordPreReleaseCorrection(db(), { orderItemId: past.itemId, note: "x" }, "admin"),
    ).toBe(false);
  });
});
