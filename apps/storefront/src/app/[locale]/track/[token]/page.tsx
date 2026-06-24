import { notFound } from "next/navigation";

import { getDb, getOrderByTrackingToken } from "@cutura/db";

import { OrderDetailView } from "@/components/OrderDetailView";
import { defaultLocale, isLocale } from "@/i18n/config";
import { getOrderMessages } from "@/i18n/messages";
import { getEnv } from "@/server/env";

export const dynamic = "force-dynamic";

// Public order tracking by guest token (no auth, no internal data).
export default async function TrackPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale: raw, token } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getOrderMessages(locale);
  const env = getEnv();
  const detail = await getOrderByTrackingToken(
    getDb(env.DB),
    token,
    env.MEASUREMENT_ENCRYPTION_KEY,
  );
  if (!detail) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t.trackingTitle}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {t.orderNumber} <span className="font-mono">{detail.orderNumber}</span>
      </p>
      <OrderDetailView detail={detail} locale={locale} />
    </main>
  );
}
