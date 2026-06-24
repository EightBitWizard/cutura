import { getDb, submitFitFeedback } from "@cutura/db";

import { defaultLocale, isLocale } from "@/i18n/config";
import { getEnv } from "@/server/env";
import { redirectTo } from "@/server/http";
import { getCustomerId } from "@/server/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const rawLocale = String(form.get("locale") ?? "");
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const customerId = await getCustomerId();
  if (!customerId) return redirectTo(request, `/${locale}/account/login`);

  const orderId = String(form.get("orderId") ?? "");
  const rating = Number.parseInt(String(form.get("overallRating") ?? ""), 10);
  if (Number.isNaN(rating) || rating < 1 || rating > 5) {
    return redirectTo(request, `/${locale}/account/orders/${orderId}/feedback?error=rating`);
  }
  const notes = String(form.get("notes") ?? "").trim() || undefined;
  const wantsRemake = form.get("wantsRemake") === "on";

  await submitFitFeedback(getDb(getEnv().DB), {
    customerId,
    orderId,
    overallRating: rating,
    notes,
    wantsRemake,
  });
  return redirectTo(request, `/${locale}/account/orders/${orderId}?feedback=1`);
}
