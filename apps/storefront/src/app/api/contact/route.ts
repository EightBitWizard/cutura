import { verifyTurnstile } from "@cutura/core";
import { ResendEmailProvider, getDb, submitContactMessage } from "@cutura/db";

import { defaultLocale, isLocale } from "@/i18n/config";
import { getEnv } from "@/server/env";
import { redirectTo } from "@/server/http";
import { rateLimit } from "@/server/ratelimit";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const rawLocale = String(form.get("locale") ?? "");
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const dest = `/${locale}/contact`;

  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const message = String(form.get("message") ?? "").trim();
  if (!name || !email || !message) return redirectTo(request, `${dest}?error=1`);

  const env = getEnv();
  const ip = request.headers.get("cf-connecting-ip") ?? "anon";
  if (!(await rateLimit(env.RATE_LIMIT, `contact:${ip}`, 5, 3600))) {
    return redirectTo(request, `${dest}?error=throttled`);
  }
  // Turnstile (no-op until a secret is configured).
  const turnstileToken = String(form.get("cf-turnstile-response") ?? "");
  if (!(await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET))) {
    return redirectTo(request, `${dest}?error=captcha`);
  }

  await submitContactMessage(getDb(env.DB), new ResendEmailProvider(env.EMAIL_PROVIDER_KEY), {
    name,
    email,
    message,
    locale,
  });
  return redirectTo(request, `${dest}?sent=1`);
}
