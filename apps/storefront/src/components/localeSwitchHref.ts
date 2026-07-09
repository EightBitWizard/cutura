// Pure URL builder for the language switcher (FR-1221): the same page under
// another locale, preserving the current query string so context like
// /measure?gt=jacket survives a language change. Kept framework-free so it is
// unit-testable on the node pool.

import { locales } from "../i18n/config";

/** Strip a leading locale segment: "/de/measure" -> "/measure", "/de" -> "". */
function stripLocale(pathname: string): string {
  const parts = pathname.split("/");
  if (parts.length > 1 && (locales as readonly string[]).includes(parts[1] ?? "")) {
    const rest = "/" + parts.slice(2).join("/");
    return rest === "/" ? "" : rest;
  }
  return pathname === "/" ? "" : pathname;
}

/**
 * The href for switching the current page to `locale`. `search` is the current
 * query string without the leading "?" (as produced by URLSearchParams.toString()).
 */
export function localeSwitchHref(locale: string, pathname: string, search: string): string {
  const query = search ? `?${search}` : "";
  return `/${locale}${stripLocale(pathname)}${query}`;
}
