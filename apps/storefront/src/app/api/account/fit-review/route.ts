import { getDb, submitFitReview } from "@cutura/db";

import { defaultLocale, isLocale } from "@/i18n/config";
import { getEnv } from "@/server/env";
import { redirectTo } from "@/server/http";
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
