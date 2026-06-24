import type { Locale } from "@cutura/db";

const LOCALES: Locale[] = ["de", "en", "it", "fr"];

/** 303 redirect, for POST handlers that submit a form and return to a page. */
export function seeOther(location: string): Response {
  return new Response(null, { status: 303, headers: { Location: location } });
}

/**
 * Build a localized-text object from per-locale form fields named `${field}_de`,
 * `${field}_en`, etc. German is always present (forms require it).
 */
export function localizedFromForm(
  form: FormData,
  field: string,
): { de: string } & Partial<Record<Locale, string>> {
  const out: Partial<Record<Locale, string>> = {};
  for (const locale of LOCALES) {
    const value = String(form.get(`${field}_${locale}`) ?? "").trim();
    if (value) out[locale] = value;
  }
  return { de: out.de ?? "", ...out };
}
