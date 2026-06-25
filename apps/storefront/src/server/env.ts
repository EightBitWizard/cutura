import type { D1Database, KVNamespace, R2Bucket } from "@cloudflare/workers-types";

import { getCloudflareContext } from "@opennextjs/cloudflare";

// Typed accessor for the storefront worker's environment bindings. Read per
// request; never cache a binding in module scope (a D1 connection cannot cross
// requests).
export interface StorefrontEnv {
  DB: D1Database;
  SESSIONS: KVNamespace;
  RATE_LIMIT: KVNamespace;
  MEDIA: R2Bucket;
  CUTURA_ENV: string;
  // Secrets (wrangler secret put) + Shopify vars, used by the measurement,
  // checkout, and webhook routes (M3).
  SESSION_SECRET: string;
  MEASUREMENT_ENCRYPTION_KEY: string;
  EMAIL_PROVIDER_KEY: string;
  SHOPIFY_ADMIN_API_TOKEN: string;
  SHOPIFY_WEBHOOK_SECRET: string;
  SHOPIFY_STORE_DOMAIN: string;
  SHOPIFY_API_VERSION: string;
  // Optional Turnstile secret (NFR-18); when set, the contact form is verified.
  TURNSTILE_SECRET?: string;
  // Optional staging access password; when set, the whole storefront is gated by HTTP
  // Basic Auth (set on staging, leave unset on production so production stays public).
  SITE_PASSWORD?: string;
}

export function getEnv(): StorefrontEnv {
  return getCloudflareContext().env as unknown as StorefrontEnv;
}
