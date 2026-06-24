import { timingSafeEqual } from "@cutura/core";
import { getDb } from "@cutura/db";

import { getEnv } from "@/server/env";
import { reconcileOrders } from "@/server/reconcile";
import { createShopifyClient } from "@/server/shopify";

export const dynamic = "force-dynamic";

// Authenticated reconcile endpoint for a Cron/GitHub-Action trigger (FR-761).
// Guarded by a bearer matching SHOPIFY_WEBHOOK_SECRET. The schedule itself is a
// documented follow-up; the function is the value.
export async function POST(request: Request): Promise<Response> {
  const env = getEnv();
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !timingSafeEqual(token, env.SHOPIFY_WEBHOOK_SECRET)) {
    return new Response("unauthorized", { status: 401 });
  }
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const result = await reconcileOrders(
    getDb(env.DB),
    createShopifyClient(env),
    since,
    env.MEASUREMENT_ENCRYPTION_KEY,
  );
  return Response.json(result);
}
