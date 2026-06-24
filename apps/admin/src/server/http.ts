import type { Locale } from "@cutura/db";

const LOCALES: Locale[] = ["de", "en", "it", "fr"];

/** 303 redirect, for POST handlers that submit a form and return to a page. */
export function seeOther(location: string): Response {
  return new Response(null, { status: 303, headers: { Location: location } });
}

/**
 * Restrict a form-supplied redirect target to a same-origin relative path,
 * rejecting absolute and protocol-relative URLs. Prevents open redirects from
 * user-controlled `back` fields.
 */
export function safePath(value: FormDataEntryValue | null, fallback = "/"): string {
  const v = typeof value === "string" ? value : "";
  if (v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\")) return v;
  return fallback;
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
