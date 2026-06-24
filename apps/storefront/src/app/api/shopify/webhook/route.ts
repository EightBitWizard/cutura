import { type EmailLocale, hmacSha256Base64, timingSafeEqual } from "@cutura/core";
import {
  ResendEmailProvider,
  findOrderIdByNumber,
  getDb,
  getOrderById,
  processPaidEvent,
  renderOrderConfirmation,
  sendEmailAndLog,
} from "@cutura/db";

import { isLocale } from "@/i18n/config";
import { getEnv } from "@/server/env";

export const dynamic = "force-dynamic";

interface ShopifyOrderPayload {
  id?: number | string;
  admin_graphql_api_id?: string;
  tags?: string | string[];
  financial_status?: string;
  note_attributes?: Array<{ name?: string; value?: string }>;
}

async function resolveLocalOrderId(
  db: ReturnType<typeof getDb>,
  payload: ShopifyOrderPayload,
): Promise<string | null> {
  const attrs = Array.isArray(payload.note_attributes) ? payload.note_attributes : [];
  const direct = attrs.find((a) => a?.name === "_cutura_order_id")?.value;
  if (typeof direct === "string" && direct) return direct;

  const tags =
    typeof payload.tags === "string"
      ? payload.tags.split(",").map((s) => s.trim())
      : Array.isArray(payload.tags)
        ? payload.tags
        : [];
  const tag = tags.find((t) => t.startsWith("cutura-order:"));
  if (tag) return findOrderIdByNumber(db, tag.slice("cutura-order:".length));
  return null;
}

// Shopify webhook receiver: verifies the HMAC over the RAW body, then dispatches
// by topic. Paid events ingest idempotently into the order pipeline. Responds 200
// within the 5s budget; the pipeline work is intentionally lean.
export async function POST(request: Request): Promise<Response> {
  const env = getEnv();
  const raw = await request.text();
  const provided = request.headers.get("x-shopify-hmac-sha256") ?? "";
  const expected = await hmacSha256Base64(raw, env.SHOPIFY_WEBHOOK_SECRET);
  if (!provided || !timingSafeEqual(expected, provided)) {
    return new Response("invalid signature", { status: 401 });
  }

  const topic = request.headers.get("x-shopify-topic") ?? "";
  const webhookId = request.headers.get("x-shopify-webhook-id") ?? crypto.randomUUID();

  let payload: ShopifyOrderPayload;
  try {
    payload = JSON.parse(raw) as ShopifyOrderPayload;
  } catch {
    return new Response("bad json", { status: 400 });
  }

  // GDPR compliance topics: acknowledge (full handling in the privacy milestone).
  if (topic.startsWith("customers/") || topic.startsWith("shop/")) {
    return new Response("ok", { status: 200 });
  }

  if (topic === "orders/paid" || topic === "orders/create") {
    // orders/create is only a backstop; ignore until actually paid.
    if (
      topic === "orders/create" &&
      payload.financial_status &&
      payload.financial_status !== "paid"
    ) {
      return new Response("ok (not paid)", { status: 200 });
    }
    const db = getDb(env.DB);
    const orderId = await resolveLocalOrderId(db, payload);
    if (!orderId) return new Response("ok (unmatched)", { status: 200 });
    const result = await processPaidEvent(
      db,
      {
        eventId: webhookId,
        shopifyOrderId: String(payload.admin_graphql_api_id ?? payload.id ?? ""),
        orderId,
        type: topic,
        payload,
      },
      { measurementKey: env.MEASUREMENT_ENCRYPTION_KEY },
    );
    // Order confirmation email once, on first processing (FR-790/901).
    if (result.status === "processed") {
      const order = await getOrderById(db, orderId);
      if (order?.guestEmail) {
        const locale: EmailLocale = isLocale(order.locale) ? order.locale : "de";
        const trackingUrl = order.guestTrackingToken
          ? `${new URL(request.url).origin}/${locale}/track/${order.guestTrackingToken}`
          : undefined;
        await sendEmailAndLog(
          db,
          new ResendEmailProvider(env.EMAIL_PROVIDER_KEY),
          renderOrderConfirmation(
            {
              to: order.guestEmail,
              orderNumber: order.orderNumber,
              totalMinor: order.totalMinor,
              trackingUrl,
            },
            locale,
          ),
          { orderId, template: "order_confirmation" },
        );
      }
    }
    return new Response("ok", { status: 200 });
  }

  // orders/cancelled, refunds/create, etc.: acknowledge (status reflection later).
  return new Response("ok", { status: 200 });
}
