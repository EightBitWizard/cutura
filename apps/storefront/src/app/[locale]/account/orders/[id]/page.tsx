import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCustomerOrderDetail, getDb } from "@cutura/db";

import { OrderDetailView } from "@/components/OrderDetailView";
import { defaultLocale, isLocale } from "@/i18n/config";
import { getOrderMessages } from "@/i18n/messages";
import { getEnv } from "@/server/env";
import { getCustomerId } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getOrderMessages(locale);
  const customerId = await getCustomerId();
  if (!customerId) redirect(`/${locale}/account/login`);

  const env = getEnv();
  const detail = await getCustomerOrderDetail(
    getDb(env.DB),
    customerId,
    id,
    env.MEASUREMENT_ENCRYPTION_KEY,
  );
  if (!detail) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.orderNumber} <span className="font-mono">{detail.orderNumber}</span>
        </h1>
        <Link href={`/${locale}/account/orders`} className="text-sm text-neutral-600 underline">
          {t.ordersTitle}
        </Link>
      </div>

      <OrderDetailView detail={detail} locale={locale} />

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link href={`/${locale}/account/orders/${id}/fit-review`} className="underline">
          {t.fitReview}
        </Link>
        <Link href={`/${locale}/account/orders/${id}/feedback`} className="underline">
          {t.feedback}
        </Link>
      </div>
    </main>
  );
}
