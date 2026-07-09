import type { D1Database } from "@cloudflare/workers-types";
import { type NextRequest, NextResponse } from "next/server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { pickLocale, timingSafeEqual } from "@cutura/core";
import { getDb, getRedirect } from "@cutura/db";

import { SITE_ACCESS_COOKIE, hasSiteAccess } from "@/server/access";
import { defaultLocale, locales } from "@/i18n/config";
import { type KVLike, readSessionCookie, verifyCustomerSession } from "@/server/auth";

export const LOCALE_COOKIE = "cutura_locale";

// Ensure every page route is under a locale prefix, and gate the account area
// behind a customer session. Static assets and API routes are excluded (matcher).
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const env = getCloudflareContext().env as unknown as {
    DB: D1Database;
    SESSIONS: KVLike;
    SESSION_SECRET: string;
    SITE_PASSWORD?: string;
  };

  // Private staging gate: when SITE_PASSWORD is set the whole storefront is behind a
  // password form backed by a long-lived signed cookie (production leaves it unset and
  // stays public). /api + static are excluded by the matcher, so health checks and the
  // Shopify webhook stay reachable. The x-site-access header lets the automated
  // smoke/a11y tests in (humans use the form).
  if (env.SITE_PASSWORD) {
    const onAccessPage = /^\/(?:de|en|it|fr)\/site-access(?:\/|$)/.test(pathname);
    const headerValue = request.headers.get("x-site-access");
    const headerOk = headerValue !== null && timingSafeEqual(headerValue, env.SITE_PASSWORD);
    const cookieOk = await hasSiteAccess(
      request.cookies.get(SITE_ACCESS_COOKIE)?.value,
      env.SITE_PASSWORD,
    );
    if (!onAccessPage && !headerOk && !cookieOk) {
      const remembered = request.cookies.get(LOCALE_COOKIE)?.value;
      const locale =
        remembered && (locales as readonly string[]).includes(remembered)
          ? remembered
          : pickLocale(request.headers.get("accept-language"), locales, defaultLocale);
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/site-access`;
      url.search = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
      return NextResponse.redirect(url);
    }
  }

  // Admin-managed redirects (NFR-20): an exact-path match wins before anything else.
  // Fail open on lookup errors: a transient D1 failure must not 500 every page, it
  // only costs the redirect. Auth and the site-access gate above never fail open.
  let red: { toPath: string; code: number } | null = null;
  try {
    red = await getRedirect(getDb(env.DB), pathname);
  } catch {
    red = null;
  }
  if (red) {
    const url = request.nextUrl.clone();
    url.pathname = red.toPath;
    url.search = "";
    return NextResponse.redirect(url, red.code);
  }

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (!hasLocale) {
    // Choose the locale from the remembered cookie, else the browser language,
    // else German (FR-1220/1221/1202).
    const remembered = request.cookies.get(LOCALE_COOKIE)?.value;
    const chosen =
      remembered && (locales as readonly string[]).includes(remembered)
        ? remembered
        : pickLocale(request.headers.get("accept-language"), locales, defaultLocale);
    const url = request.nextUrl.clone();
    url.pathname = `/${chosen}${pathname === "/" ? "" : pathname}`;
    const res = NextResponse.redirect(url);
    res.cookies.set(LOCALE_COOKIE, chosen, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return res;
  }

  const locale = pathname.split("/")[1] ?? defaultLocale;
  const rest = pathname.slice(`/${locale}`.length);
  const isAccount = rest === "/account" || rest.startsWith("/account/");
  const isLoginFlow = rest === "/account/login" || rest.startsWith("/account/login");
  if (isAccount && !isLoginFlow) {
    const token = readSessionCookie(request.headers.get("cookie"));
    const ok = await verifyCustomerSession(token, env.SESSIONS, env.SESSION_SECRET);
    if (!ok) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/account/login`;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
