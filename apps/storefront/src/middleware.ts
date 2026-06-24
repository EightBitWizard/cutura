import { type NextRequest, NextResponse } from "next/server";

import { defaultLocale, locales } from "@/i18n/config";

// Ensure every page route is under a locale prefix; requests without a known
// locale redirect to the default. Static assets and API routes are excluded.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
