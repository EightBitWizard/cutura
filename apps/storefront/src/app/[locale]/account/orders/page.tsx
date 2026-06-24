import Link from "next/link";
import { redirect } from "next/navigation";

import { formatCHF } from "@cutura/core";
import { getDb, listCustomerOrders } from "@cutura/db";

import { defaultLocale, isLocale } from "@/i18n/config";
import { getOrderMessages, milestoneLabels } from "@/i18n/messages";
import { getEnv } from "@/server/env";
import { getCustomerId } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function OrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getOrderMessages(locale);
  const customerId = await getCustomerId();
  if (!customerId) redirect(`/${locale}/account/login`);

  const orders = await listCustomerOrders(getDb(getEnv().DB), customerId);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t.ordersTitle}</h1>
        <Link href={`/${locale}/account`} className="text-sm text-neutral-600 underline">
          {t.viewOrder}
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="mt-6 text-neutral-500">{t.empty}</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/${locale}/account/orders/${o.id}`}
                className="flex items-center justify-between rounded-lg border border-neutral-200 p-4 hover:border-neutral-400"
              >
                <span>
                  <span className="font-mono">{o.orderNumber}</span>
                  <span className="ml-3 text-sm text-neutral-500">
                    {milestoneLabels[locale][o.milestone]}
                  </span>
                </span>
                <span className="text-sm">{formatCHF(o.totalMinor)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
