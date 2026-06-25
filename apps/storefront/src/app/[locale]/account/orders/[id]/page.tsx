import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCustomerOrderDetail, getDb, getRecommendations } from "@cutura/db";

import { OrderDetailView } from "@/components/OrderDetailView";
import { RecommendedSection } from "@/components/RecommendedSection";
import { defaultLocale, isLocale } from "@/i18n/config";
import { getMessages, getOrderMessages } from "@/i18n/messages";
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

  const tt = getMessages(locale);
  const recommended = await getRecommendations(getDb(env.DB), locale, { customerId, limit: 4 });

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.orderNumber} <span className="font-mono">{detail.orderNumber}</span>
        </h1>
        <Link href={`/${locale}/account/orders`} className="text-sm text-ink-muted underline">
          {t.ordersTitle}
        </Link>
      </div>

      <OrderDetailView detail={detail} locale={locale} />

      <section className="mt-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-ink-subtle">
          {t.reorderTitle}
        </h2>
        {detail.items.map((item) => (
          <div key={item.id} className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-ink-muted">{item.baseModelName}</span>
            {(["keep", "update"] as const).map((mode) => (
              <form key={mode} method="post" action="/api/account/reorder">
                <input type="hidden" name="orderItemId" value={item.id} />
                <input type="hidden" name="mode" value={mode} />
                <input type="hidden" name="locale" value={locale} />
                <button type="submit" className="rounded border border-line-strong px-2 py-1">
                  {mode === "keep" ? t.reorderKeep : t.reorderUpdate}
                </button>
              </form>
            ))}
          </div>
        ))}
      </section>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link href={`/${locale}/account/orders/${id}/fit-review`} className="underline">
          {t.fitReview}
        </Link>
        <Link href={`/${locale}/account/orders/${id}/feedback`} className="underline">
          {t.feedback}
        </Link>
      </div>

      <RecommendedSection
        locale={locale}
        heading={tt.recommendedForYou}
        models={recommended}
        fromLabel={tt.from}
        notifyLabel={tt.notifyMe}
      />
    </main>
  );
}
