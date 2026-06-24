import type { D1Database } from "@cloudflare/workers-types";
import { type NextRequest, NextResponse } from "next/server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { pickLocale } from "@cutura/core";
import { getDb, getRedirect } from "@cutura/db";

import { defaultLocale, locales } from "@/i18n/config";
import { type KVLike, readSessionCookie, verifyCustomerSession } from "@/server/auth";

export const LOCALE_COOKIE = "cutura_locale";

// Ensure every page route is under a locale prefix, and gate the account area
// behind a customer session. Static assets and API routes are excluded (matcher).
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin-managed redirects (NFR-20): an exact-path match wins before anything else.
  const env = getCloudflareContext().env as unknown as {
    DB: D1Database;
    SESSIONS: KVLike;
    SESSION_SECRET: string;
  };
  const red = await getRedirect(getDb(env.DB), pathname);
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
