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
}

export function getEnv(): StorefrontEnv {
  return getCloudflareContext().env as unknown as StorefrontEnv;
}
