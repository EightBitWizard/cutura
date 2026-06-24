import type { D1Database, KVNamespace, R2Bucket } from "@cloudflare/workers-types";

import { getCloudflareContext } from "@opennextjs/cloudflare";

// Typed accessor for the admin worker's bindings and secrets. Read per request;
// never cache a binding in module scope.
export interface AdminEnv {
  CONTROL_DB: D1Database;
  STAGING_DB: D1Database;
  PRODUCTION_DB: D1Database;
  SESSIONS: KVNamespace;
  RATE_LIMIT: KVNamespace;
  MEDIA_CONTROL: R2Bucket;
  MEDIA_STAGING: R2Bucket;
  MEDIA_PRODUCTION: R2Bucket;
  SESSION_SECRET: string;
  ADMIN_AUTH_SECRET: string;
  // Decrypts production-package snapshots for the order detail view + supplier
  // spec, and sends supplier/status emails from the order-ops surface (M3).
  MEASUREMENT_ENCRYPTION_KEY: string;
  EMAIL_PROVIDER_KEY: string;
  CUTURA_ENV: string;
}

export function getEnv(): AdminEnv {
  return getCloudflareContext().env as unknown as AdminEnv;
}
