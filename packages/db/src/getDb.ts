import type { D1Database } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";

import * as schema from "./schema";

/**
 * Build a Drizzle client for a D1 binding. Call this PER REQUEST from
 * getCloudflareContext().env.<BINDING> - never cache a D1-backed client in
 * module scope, because a D1 connection cannot be reused across requests.
 */
export function getDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type Database = ReturnType<typeof getDb>;
