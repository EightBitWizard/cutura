import { z } from "zod";

// Landing-page editorial text (FR-372 area), stored as one JSON value under the
// `landing` config key, env-direct like operations settings. Pure: schema + safe
// parse. Every field is optional; the storefront falls back to its i18n defaults when
// a field is empty or unset. Images are stored separately as `media` rows
// (entityType "landing"). The how-it-works steps and labels stay in the i18n catalog.

export const LANDING_CONFIG_KEY = "landing";

// Localized text; German is required when a field is present (the storefront fallback
// chain is configured-locale -> German -> i18n default).
const localizedTextSchema = z.object({
  de: z.string(),
  en: z.string().optional(),
  it: z.string().optional(),
  fr: z.string().optional(),
});

export type LandingText = z.infer<typeof localizedTextSchema>;

export const landingConfigSchema = z.object({
  heroHeadline: localizedTextSchema.optional(),
  heroLead: localizedTextSchema.optional(),
  fabricTitle: localizedTextSchema.optional(),
  fabricBody: localizedTextSchema.optional(),
  trustTitle: localizedTextSchema.optional(),
  trustBody: localizedTextSchema.optional(),
});

export type LandingConfig = z.infer<typeof landingConfigSchema>;

export const DEFAULT_LANDING_CONFIG: LandingConfig = {};

/** Parse a stored landing config; fall back to empty defaults if missing or invalid. */
export function parseLandingConfig(value: unknown): LandingConfig {
  const parsed = landingConfigSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_LANDING_CONFIG;
}
