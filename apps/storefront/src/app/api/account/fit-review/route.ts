import { customerOwnsOrder, getDb, submitFitReview } from "@cutura/db";

import { defaultLocale, isLocale } from "@/i18n/config";
import { getEnv } from "@/server/env";
import { redirectTo } from "@/server/http";
import { rateLimit } from "@/server/ratelimit";
import { getCustomerId } from "@/server/session";

export const dynamic = "force-dynamic";

// Only raster image types (no SVG/HTML) for uploaded fit-review photos.
const ALLOWED = ["image/png", "image/jpeg", "image/webp"];

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const rawLocale = String(form.get("locale") ?? "");
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const customerId = await getCustomerId();
  if (!customerId) return redirectTo(request, `/${locale}/account/login`);

  const orderId = String(form.get("orderId") ?? "");
  const reason = String(form.get("reason") ?? "").trim();
  if (!reason) {
    return redirectTo(request, `/${locale}/account/orders/${orderId}/fit-review?error=reason`);
  }

  const env = getEnv();
  const ip = request.headers.get("cf-connecting-ip") ?? "anon";
  if (!(await rateLimit(env.RATE_LIMIT, `fitreview:${ip}`, 5, 3600))) {
    return redirectTo(request, `/${locale}/account/orders/${orderId}/fit-review?error=throttled`);
  }

  // Ownership gate BEFORE any storage side effect: photos of a foreign order id
  // must never reach R2 (submitFitReview re-checks ownership on insert).
  if (!(await customerOwnsOrder(getDb(env.DB), customerId, orderId))) {
    return redirectTo(request, `/${locale}/account/orders/${orderId}/fit-review?error=not_owner`);
  }

  const photoR2Keys: string[] = [];
  for (const file of form.getAll("photos")) {
    if (file instanceof File && file.size > 0 && ALLOWED.includes(file.type)) {
      const key = `fit-review/${orderId}/${crypto.randomUUID()}`;
      await env.MEDIA.put(key, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type },
      });
      photoR2Keys.push(key);
    }
  }

  const result = await submitFitReview(getDb(env.DB), {
    customerId,
    orderId,
    reason,
    photoR2Keys: photoR2Keys.length > 0 ? photoR2Keys : undefined,
  });
  if (!result.ok) {
    return redirectTo(
      request,
      `/${locale}/account/orders/${orderId}/fit-review?error=${result.reason}`,
    );
  }
  return redirectTo(request, `/${locale}/account/orders/${orderId}?fitreview=1`);
}
