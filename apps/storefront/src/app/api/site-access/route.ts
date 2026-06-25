import {
  SITE_ACCESS_COOKIE,
  SITE_ACCESS_MAX_AGE,
  checkSitePassword,
  signSiteAccess,
} from "@/server/access";
import { defaultLocale, isLocale } from "@/i18n/config";
import { getEnv } from "@/server/env";

export const dynamic = "force-dynamic";

// Verify the staging access password and set the long-lived signed cookie, then return
// to where the visitor was headed. /api is outside the gate matcher, so this is reachable
// while unauthenticated. No-op when SITE_PASSWORD is unset (production).
export async function POST(request: Request): Promise<Response> {
  const env = getEnv();
  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  const rawLocale = String(form.get("locale") ?? "");
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const nextRaw = String(form.get("next") ?? "/");
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/";
  const origin = new URL(request.url).origin;

  if (!env.SITE_PASSWORD || !checkSitePassword(password, env.SITE_PASSWORD)) {
    const back = `${origin}/${locale}/site-access?error=1&next=${encodeURIComponent(next)}`;
    return new Response(null, { status: 303, headers: { Location: back } });
  }

  const token = await signSiteAccess(env.SITE_PASSWORD);
  const headers = new Headers({ Location: `${origin}${next}` });
  headers.append(
    "Set-Cookie",
    `${SITE_ACCESS_COOKIE}=${token}; Path=/; Max-Age=${SITE_ACCESS_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
  );
  return new Response(null, { status: 303, headers });
}
