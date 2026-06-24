import { type NextRequest, NextResponse } from "next/server";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import { type KVLike, readSessionCookie, verifySessionToken } from "@/server/auth";

// Protect the whole admin surface. Unauthenticated requests to anything other
// than the login flow and the health check are redirected to /login.
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout", "/api/health"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const env = getCloudflareContext().env as unknown as {
    SESSIONS: KVLike;
    SESSION_SECRET: string;
  };
  const token = readSessionCookie(request.headers.get("cookie"));
  const ok = await verifySessionToken(token, env.SESSIONS, env.SESSION_SECRET);
  if (ok) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};
