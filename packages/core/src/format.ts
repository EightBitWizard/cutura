// Locale-aware date + number formatting (FR-1260). Swiss regional variants so
// grouping and date order read naturally; CHF money stays in money.ts.
const BCP47: Record<string, string> = {
  de: "de-CH",
  en: "en-CH",
  it: "it-CH",
  fr: "fr-CH",
};

function tag(locale: string): string {
  return BCP47[locale] ?? locale;
}

/** Format an ISO timestamp for a locale (medium date). Empty string if invalid. */
export function formatDate(iso: string, locale: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "";
  return new Intl.DateTimeFormat(tag(locale), { dateStyle: "medium" }).format(new Date(ms));
}

/** Format a number for a locale. */
export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(tag(locale)).format(value);
}
