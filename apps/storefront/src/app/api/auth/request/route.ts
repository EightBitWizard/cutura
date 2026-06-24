import { generateMagicToken, sha256Hex } from "@cutura/core";
import { ResendEmailProvider, getDb, renderMagicLinkEmail, sendEmailAndLog } from "@cutura/db";

import { defaultLocale, isLocale } from "@/i18n/config";
import { issueMagicLink } from "@/server/auth";
import { getEnv } from "@/server/env";
import { rateLimit } from "@/server/ratelimit";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RequestBody {
  email?: string;
  locale?: string;
}

// Issue a magic-link sign-in. Always returns a neutral 200 (no account
// enumeration). Rate-limited per email + per IP. In non-production, the link is
// also returned so staging works before Resend is provisioned.
export async function POST(request: Request): Promise<Response> {
  const env = getEnv();
  const body = (await request.json().catch(() => null)) as RequestBody | null;
  const email = (body?.email ?? "").trim().toLowerCase();
  const rawLocale = body?.locale ?? "";
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const neutral = Response.json({ ok: true });
  if (!EMAIL_RE.test(email)) return neutral;

  const kv = env.SESSIONS;
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  const emailKey = `magiclink:email:${await sha256Hex(email)}`;
  const okEmail = await rateLimit(kv, emailKey, 5, 3600);
  const okIp = await rateLimit(kv, `magiclink:ip:${ip}`, 20, 3600);
  if (!okEmail || !okIp) return neutral; // silently throttle

  const token = generateMagicToken();
  await issueMagicLink(kv, token, email, locale);
  const origin = new URL(request.url).origin;
  const magicUrl = `${origin}/api/auth/verify?token=${encodeURIComponent(token)}&locale=${locale}`;

  await sendEmailAndLog(
    getDb(env.DB),
    new ResendEmailProvider(env.EMAIL_PROVIDER_KEY),
    renderMagicLinkEmail({ to: email, magicUrl }, locale),
    { template: "magic_link" },
  );

  if (env.CUTURA_ENV !== "production") {
    return Response.json({ ok: true, devMagicUrl: magicUrl });
  }
  return neutral;
}
