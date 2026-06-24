import { cookies } from "next/headers";
import Link from "next/link";

import { formatCHF } from "@cutura/core";
import { getDb } from "@cutura/db";

import { CheckoutForm } from "@/components/CheckoutForm";
import { defaultLocale, isLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/legal";
import { CART_COOKIE, readCart } from "@/server/cart";
import { getEnv } from "@/server/env";
import { MEASURE_COOKIE } from "@/server/measurement";
import { priceConfigured } from "@/server/pricing";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getMessages(locale);

  const cookieStore = await cookies();
  const cart = await readCart(cookieStore.get(CART_COOKIE)?.value);
  const hasMeasurement = Boolean(cookieStore.get(MEASURE_COOKIE)?.value);
  const db = getDb(getEnv().DB);

  let total = 0;
  let allValid = cart.lines.length > 0;
  for (const line of cart.lines) {
    const priced = await priceConfigured(db, line.handle, locale, line);
    if (!priced || !priced.valid) {
      allValid = false;
      continue;
    }
    total += priced.breakdown.total;
  }
  const configMissing = !allValid;
  const measurementMissing = !hasMeasurement;
  const ready = !configMissing && !measurementMissing;

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t.checkout.title}</h1>

      <div className="mt-4 flex items-baseline justify-between border-b pb-3">
        <span className="text-neutral-500">{t.cart.total}</span>
        <span className="text-xl font-semibold">{formatCHF(total)}</span>
      </div>
      <p className="text-xs text-neutral-400">{t.allInclusive}</p>
      <p className="mt-2 text-sm text-neutral-500">{t.checkout.regionNote}</p>

      {configMissing && (
        <p className="mt-4 text-sm text-amber-700">
          {t.checkout.missingConfig}{" "}
          <Link href={`/${locale}/cart`} className="underline">
            {t.cart.title}
          </Link>
        </p>
      )}
      {measurementMissing && (
        <p className="mt-2 text-sm text-amber-700">
          {t.checkout.missingMeasurement}{" "}
          <Link href={`/${locale}/measure?return=/${locale}/checkout`} className="underline">
            {t.cart.addMeasurement}
          </Link>
        </p>
      )}

      <CheckoutForm
        locale={locale}
        messages={t.checkout}
        ready={ready}
        termsVersion={TERMS_VERSION}
        privacyVersion={PRIVACY_VERSION}
      />
    </main>
  );
}
