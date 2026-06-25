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
import { measuredGarmentTypes } from "@/server/measurementStatus";
import { priceConfigured } from "@/server/pricing";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getMessages(locale);

  const cookieStore = await cookies();
  const cart = await readCart(cookieStore.get(CART_COOKIE)?.value);
  const db = getDb(getEnv().DB);

  let total = 0;
  let allValid = cart.lines.length > 0;
  const garmentTypes: string[] = [];
  for (const line of cart.lines) {
    const priced = await priceConfigured(db, line.handle, locale, line);
    if (!priced || !priced.valid) {
      allValid = false;
      continue;
    }
    garmentTypes.push(priced.model.garmentType);
    total += priced.breakdown.total;
  }
  const measured = await measuredGarmentTypes(garmentTypes);
  const missingTypes = [...new Set(garmentTypes)].filter((gt) => !measured.has(gt));
  const configMissing = !allValid;
  const measurementMissing = missingTypes.length > 0;
  const ready = !configMissing && !measurementMissing;

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t.checkout.title}</h1>

      <div className="mt-4 flex items-baseline justify-between border-b border-line pb-3">
        <span className="text-ink-subtle">{t.cart.total}</span>
        <span className="text-xl font-semibold">{formatCHF(total)}</span>
      </div>
      <p className="text-xs text-ink-subtle">{t.allInclusive}</p>
      <p className="mt-2 text-sm text-ink-subtle">{t.checkout.regionNote}</p>

      {configMissing && (
        <p className="mt-4 text-sm text-warning">
          {t.checkout.missingConfig}{" "}
          <Link href={`/${locale}/cart`} className="underline">
            {t.cart.title}
          </Link>
        </p>
      )}
      {missingTypes.map((gt) => (
        <p key={gt} className="mt-2 text-sm text-warning">
          {t.checkout.missingMeasurement} ({t.garmentNames[gt as "shirt" | "trouser"]}){" "}
          <Link
            href={`/${locale}/measure?gt=${gt}&return=/${locale}/checkout`}
            className="underline"
          >
            {t.cart.addMeasurement}
          </Link>
        </p>
      ))}

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
