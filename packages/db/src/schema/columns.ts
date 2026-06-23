// Shared column conventions for D1 (SQLite). D1 has no native array, boolean, or
// timestamp types, so: store ids as text, timestamps as ISO-8601 text, booleans
// as integer 0/1 (mode: "boolean"), and arrays/objects as JSON text columns
// validated with zod on read and write. Money is integer minor units (Rappen).
//
// Helpers return fresh column builders per call - a builder instance must not be
// shared across tables.

import { text } from "drizzle-orm/sqlite-core";

/** The four launch locales; German is default and fallback. */
export const LOCALES = ["de", "en", "it", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

/** The two runtime environments a catalog entity can be published to. */
export const ENVIRONMENTS = ["staging", "production"] as const;
export type Environment = (typeof ENVIRONMENTS)[number];

/** created_at and updated_at as ISO-8601 text. Spread into a table definition. */
export function timestamps() {
  return {
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  };
}

/** Per-locale localized string, e.g. { de, en, it, fr }. German required as fallback. */
export type LocalizedText = { de: string } & Partial<Record<Locale, string>>;
