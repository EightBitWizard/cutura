import { type NextRequest, NextResponse } from "next/server";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import { defaultLocale, locales } from "@/i18n/config";
import { type KVLike, readSessionCookie, verifyCustomerSession } from "@/server/auth";

// Ensure every page route is under a locale prefix, and gate the account area
// behind a customer session. Static assets and API routes are excluded (matcher).
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (!hasLocale) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const locale = pathname.split("/")[1] ?? defaultLocale;
  const rest = pathname.slice(`/${locale}`.length);
  const isAccount = rest === "/account" || rest.startsWith("/account/");
  const isLoginFlow = rest === "/account/login" || rest.startsWith("/account/login");
  if (isAccount && !isLoginFlow) {
    const env = getCloudflareContext().env as unknown as {
      SESSIONS: KVLike;
      SESSION_SECRET: string;
    };
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
