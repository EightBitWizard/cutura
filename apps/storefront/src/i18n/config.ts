// The four launch locales. German is default and fallback. URLs are
// locale-prefixed (REQUIREMENTS.md E12; FR-1201, FR-1202, FR-1210). The full
// message catalogs and detection arrive in the internationalization milestone.
export const locales = ["de", "en", "it", "fr"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "de";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
