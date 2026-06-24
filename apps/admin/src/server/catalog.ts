import { type Database, getDb } from "@cutura/db";

import { getEnv } from "./env";

// Database accessors for the admin control plane. The control database is where
// the catalog is authored; environment databases receive published copies.
export function controlDb(): Database {
  return getDb(getEnv().CONTROL_DB);
}

export function environmentDb(environment: "staging" | "production"): Database {
  const env = getEnv();
  return getDb(environment === "production" ? env.PRODUCTION_DB : env.STAGING_DB);
}

export function parseEnvironment(value: FormDataEntryValue | null): "staging" | "production" {
  return value === "production" ? "production" : "staging";
}
