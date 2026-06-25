import { eq } from "drizzle-orm";

import {
  LANDING_CONFIG_KEY,
  type LandingConfig,
  OPERATIONS_CONFIG_KEY,
  type OperationsSettings,
  landingConfigSchema,
  operationsSettingsSchema,
  parseLandingConfig,
  parseOperationsSettings,
} from "@cutura/core";

import type { Database } from "../getDb";
import { config, featureFlag } from "../schema";

const nowIso = () => new Date().toISOString();

export interface ConfigClock {
  now?: () => string;
}

/** Read a typed JSON config value, or null if unset. */
export async function getConfig<T = unknown>(db: Database, key: string): Promise<T | null> {
  const [row] = await db.select().from(config).where(eq(config.key, key));
  return row ? (row.value as T) : null;
}

/** Upsert a JSON config value. */
export async function setConfig(
  db: Database,
  key: string,
  value: unknown,
  deps: ConfigClock = {},
): Promise<void> {
  const now = (deps.now ?? nowIso)();
  await db
    .insert(config)
    .values({ key, value, updatedAt: now })
    .onConflictDoUpdate({ target: config.key, set: { value, updatedAt: now } });
}

export interface FeatureFlagState {
  enabled: boolean;
  value: unknown;
}

export async function getFeatureFlag(db: Database, key: string): Promise<FeatureFlagState | null> {
  const [row] = await db.select().from(featureFlag).where(eq(featureFlag.key, key));
  return row ? { enabled: row.enabled, value: row.value } : null;
}

export async function setFeatureFlag(
  db: Database,
  key: string,
  enabled: boolean,
  value: unknown = null,
  deps: ConfigClock = {},
): Promise<void> {
  const now = (deps.now ?? nowIso)();
  await db
    .insert(featureFlag)
    .values({ key, enabled, value, updatedAt: now })
    .onConflictDoUpdate({ target: featureFlag.key, set: { enabled, value, updatedAt: now } });
}

/** The operations settings (capacity, pause, vacation, lead-time buffer), defaulted when unset. */
export async function getOperationsSettings(db: Database): Promise<OperationsSettings> {
  return parseOperationsSettings(await getConfig(db, OPERATIONS_CONFIG_KEY));
}

export async function setOperationsSettings(
  db: Database,
  settings: OperationsSettings,
  deps: ConfigClock = {},
): Promise<void> {
  await setConfig(db, OPERATIONS_CONFIG_KEY, operationsSettingsSchema.parse(settings), deps);
}

/** The landing-page editorial text (env-direct), empty-defaulted when unset. */
export async function getLandingConfig(db: Database): Promise<LandingConfig> {
  return parseLandingConfig(await getConfig(db, LANDING_CONFIG_KEY));
}

export async function setLandingConfig(
  db: Database,
  landing: LandingConfig,
  deps: ConfigClock = {},
): Promise<void> {
  await setConfig(db, LANDING_CONFIG_KEY, landingConfigSchema.parse(landing), deps);
}
