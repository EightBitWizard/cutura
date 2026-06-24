import { env } from "cloudflare:test";
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { getDb } from "../getDb";
import { auditLog, order } from "../schema";
import { executeOrderRefund } from "./refund";

const db = () => getDb(env.TARGET_TEST_DB);
const iso = "2026-06-24T10:00:00.000Z";

async function seedOrder(shopifyOrderId: string | null): Promise<string> {
  const id = crypto.randomUUID();
  await db().insert(order).values({
    id,
    orderNumber: id,
    shopifyOrderId,
    totalMinor: 12900,
    acceptedTermsVersion: "v1",
    acceptedPrivacyVersion: "v1",
    status: "shipped",
    createdAt: iso,
    updatedAt: iso,
  });
  return id;
}

async function auditAction(orderId: string): Promise<string | undefined> {
  const [row] = await db()
    .select()
    .from(auditLog)
    .where(and(eq(auditLog.entityType, "order"), eq(auditLog.entityId, orderId)));
  return row?.action;
}

describe("executeOrderRefund", () => {
  it("calls the injected refund with the order's Shopify id and audits success", async () => {
    const orderId = await seedOrder(`gid://shopify/Order/${crypto.randomUUID()}`);
    let seen: { orderId: string; idempotencyKey: string } | null = null;
    const res = await executeOrderRefund(db(), {
      orderId,
      actor: "admin",
      reason: "Fit guarantee refund",
      refund: async (input) => {
        seen = { orderId: input.orderId, idempotencyKey: input.idempotencyKey };
        return { refundId: "gid://shopify/Refund/1", userErrors: [] };
      },
    });
    expect(res.status).toBe("refunded");
    expect(res.refundId).toBe("gid://shopify/Refund/1");
    expect(seen!.orderId).toContain("gid://shopify/Order/");
    expect(seen!.idempotencyKey).toBe(`fit-refund-${orderId}`);
    expect(await auditAction(orderId)).toBe("refund.executed");
  });

  it("skips (no live call) when the order has no Shopify id", async () => {
    const orderId = await seedOrder(null);
    let called = false;
    const res = await executeOrderRefund(db(), {
      orderId,
      actor: "admin",
      reason: "x",
      refund: async () => {
        called = true;
        return { refundId: "", userErrors: [] };
      },
    });
    expect(res.status).toBe("no_shopify_order");
    expect(called).toBe(false);
    expect(await auditAction(orderId)).toBe("refund.skipped_no_shopify");
  });

  it("reports failure on Shopify user errors", async () => {
    const orderId = await seedOrder(`gid://shopify/Order/${crypto.randomUUID()}`);
    const res = await executeOrderRefund(db(), {
      orderId,
      actor: "admin",
      reason: "x",
      refund: async () => ({ refundId: "", userErrors: [{ message: "already refunded" }] }),
    });
    expect(res.status).toBe("failed");
    expect(await auditAction(orderId)).toBe("refund.failed");
  });
});
