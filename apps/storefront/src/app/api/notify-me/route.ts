import { getDb, recordNotifyRequest } from "@cutura/db";

import { defaultLocale, isLocale } from "@/i18n/config";
import { getEnv } from "@/server/env";
import { redirectTo } from "@/server/http";
import { rateLimit } from "@/server/ratelimit";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const rawLocale = String(form.get("locale") ?? "");
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const handle = String(form.get("handle") ?? "");
  const dest = `/${locale}/products/${handle}`;

  const email = String(form.get("email") ?? "").trim();
  const entityType = String(form.get("entityType") ?? "").trim();
  const entityId = String(form.get("entityId") ?? "").trim();
  if (!email || !entityType || !entityId) return redirectTo(request, `${dest}?notify=error`);

  const env = getEnv();
  const ip = request.headers.get("cf-connecting-ip") ?? "anon";
  if (!(await rateLimit(env.RATE_LIMIT, `notify:${ip}`, 5, 3600))) {
    return redirectTo(request, `${dest}?notify=throttled`);
  }

  await recordNotifyRequest(getDb(env.DB), { email, entityType, entityId, locale });
  return redirectTo(request, `${dest}?notify=ok`);
}
