// Minimal Shopify Admin GraphQL refund call for the admin (mirrors the storefront
// client's refundCreate). Used by the fit-review "refund" decision. No live calls
// happen in CI; credentials come from worker secrets (live-gated).

import type { RefundInput } from "@cutura/core";

import type { AdminEnv } from "./env";

const DEFAULT_VERSION = "2026-04";

/** True when the admin worker has Shopify credentials (else refunds stay recorded-only). */
export function shopifyConfigured(env: AdminEnv): boolean {
  return Boolean(env.SHOPIFY_STORE_DOMAIN && env.SHOPIFY_ADMIN_API_TOKEN);
}

export async function shopifyRefund(
  env: AdminEnv,
  input: RefundInput,
): Promise<{ refundId: string; userErrors: Array<{ message: string }> }> {
  const domain = env.SHOPIFY_STORE_DOMAIN;
  const token = env.SHOPIFY_ADMIN_API_TOKEN;
  if (!domain || !token) {
    throw new Error("Shopify is not configured (missing store domain or admin token)");
  }
  const version = env.SHOPIFY_API_VERSION || DEFAULT_VERSION;
  const mutation = `mutation Refund($input: RefundInput!) {
    refundCreate(input: $input) @idempotent(key: $key) { refund { id } userErrors { message } }
  }`.replace("$key", JSON.stringify(input.idempotencyKey));

  const res = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({
      query: mutation,
      variables: { input: { orderId: input.orderId, notify: input.notify, note: input.reason } },
    }),
  });
  if (!res.ok) throw new Error(`Shopify HTTP ${res.status}`);
  const json = (await res.json()) as {
    data?: {
      refundCreate: { refund: { id: string } | null; userErrors: Array<{ message: string }> };
    };
    errors?: unknown;
  };
  if (json.errors || !json.data) {
    throw new Error(`Shopify GraphQL error: ${JSON.stringify(json.errors ?? "empty")}`);
  }
  return {
    refundId: json.data.refundCreate.refund?.id ?? "",
    userErrors: json.data.refundCreate.userErrors,
  };
}
