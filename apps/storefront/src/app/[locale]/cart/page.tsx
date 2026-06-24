import { cookies } from "next/headers";
import Link from "next/link";

import { formatCHF } from "@cutura/core";
import { getDb } from "@cutura/db";

import { CartView, type CartLineView } from "@/components/CartView";
import { defaultLocale, isLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { CART_COOKIE, readCart } from "@/server/cart";
import { getEnv } from "@/server/env";
import { MEASURE_COOKIE } from "@/server/measurement";
import { priceConfigured } from "@/server/pricing";

export const dynamic = "force-dynamic";

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getMessages(locale);

  const cookieStore = await cookies();
  const cart = await readCart(cookieStore.get(CART_COOKIE)?.value);
  const hasMeasurement = Boolean(cookieStore.get(MEASURE_COOKIE)?.value);
  const db = getDb(getEnv().DB);

  const lines: CartLineView[] = [];
  for (const [index, line] of cart.lines.entries()) {
    const priced = await priceConfigured(db, line.handle, locale, line);
    if (!priced) continue; // model withdrawn since add
    lines.push({
      index,
      handle: line.handle,
      name: priced.model.name,
      fabric: priced.fabric?.name ?? null,
      base: priced.breakdown.base,
      options: priced.options.map((o) => ({ label: o.label, surcharge: o.surchargeMinor })),
      upgrades: priced.upgrades.map((u) => ({ name: u.name, price: u.priceMinor })),
      total: priced.breakdown.total,
      valid: priced.valid,
    });
  }
  const total = lines.reduce((sum, l) => sum + l.total, 0);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t.cart.title}</h1>

      {lines.length === 0 ? (
        <p className="mt-6 text-neutral-500">{t.cart.empty}</p>
      ) : (
        <>
          <CartView lines={lines} labels={{ remove: t.cart.remove, base: t.cart.base }} />

          <div className="mt-6 flex items-baseline justify-between border-t pt-4">
            <span className="font-medium">{t.cart.total}</span>
            <span className="text-2xl font-semibold">{formatCHF(total)}</span>
          </div>
          <p className="text-xs text-neutral-400">{t.allInclusive}</p>

          <div className="mt-6 rounded-lg border border-neutral-200 p-4 text-sm">
            {hasMeasurement ? (
              <p className="text-neutral-700">{t.cart.measurementProvided}</p>
            ) : (
              <p className="text-amber-700">
                {t.cart.measurementMissing}{" "}
                <Link href={`/${locale}/measure?return=/${locale}/cart`} className="underline">
                  {t.cart.addMeasurement}
                </Link>
              </p>
            )}
          </div>

          <Link
            href={`/${locale}/checkout`}
            className="mt-6 block rounded-md bg-neutral-900 px-4 py-3 text-center font-medium text-white"
          >
            {t.cart.checkout}
          </Link>
        </>
      )}
    </main>
  );
}
