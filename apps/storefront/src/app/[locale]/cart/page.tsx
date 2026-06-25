import { cookies } from "next/headers";
import Link from "next/link";

import { formatCHF } from "@cutura/core";
import { getDb, getRecommendations } from "@cutura/db";

import { CartView, type CartLineView } from "@/components/CartView";
import { RecommendedSection } from "@/components/RecommendedSection";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { defaultLocale, isLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { CART_COOKIE, readCart } from "@/server/cart";
import { getEnv } from "@/server/env";
import { measuredGarmentTypes } from "@/server/measurementStatus";
import { priceConfigured } from "@/server/pricing";
import { getCustomerId } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getMessages(locale);

  const cookieStore = await cookies();
  const cart = await readCart(cookieStore.get(CART_COOKIE)?.value);
  const db = getDb(getEnv().DB);

  const lines: CartLineView[] = [];
  const garmentTypes: string[] = [];
  const sourceModelIds: string[] = [];
  for (const [index, line] of cart.lines.entries()) {
    const priced = await priceConfigured(db, line.handle, locale, line);
    if (!priced) continue; // model withdrawn since add
    garmentTypes.push(priced.model.garmentType);
    sourceModelIds.push(priced.model.id);
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
  const measured = await measuredGarmentTypes(garmentTypes);
  const missingTypes = [...new Set(garmentTypes)].filter((gt) => !measured.has(gt));
  const recommended =
    lines.length > 0
      ? await getRecommendations(db, locale, {
          sourceModelIds,
          customerId: await getCustomerId(),
          limit: 4,
        })
      : [];

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t.cart.title}</h1>

      {lines.length === 0 ? (
        <p className="mt-6 text-ink-subtle">{t.cart.empty}</p>
      ) : (
        <>
          <CartView lines={lines} labels={{ remove: t.cart.remove, base: t.cart.base }} />

          <div className="mt-6 flex items-baseline justify-between border-t border-line pt-4">
            <span className="font-medium">{t.cart.total}</span>
            <span className="text-2xl font-semibold">{formatCHF(total)}</span>
          </div>
          <p className="text-xs text-ink-subtle">{t.allInclusive}</p>

          <div className="mt-6 rounded-lg border border-line p-4 text-sm">
            {missingTypes.length === 0 ? (
              <p className="text-ink">{t.cart.measurementProvided}</p>
            ) : (
              <div className="space-y-1 text-warning">
                {missingTypes.map((gt) => (
                  <p key={gt}>
                    {t.cart.measurementMissing} ({t.garmentNames[gt as "shirt" | "trouser"]}){" "}
                    <Link
                      href={`/${locale}/measure?gt=${gt}&return=/${locale}/cart`}
                      className="underline"
                    >
                      {t.cart.addMeasurement}
                    </Link>
                  </p>
                ))}
              </div>
            )}
          </div>

          <Link
            href={`/${locale}/checkout`}
            className={buttonClasses("primary", "lg", "mt-6 w-full")}
          >
            {t.cart.checkout}
          </Link>

          <RecommendedSection
            locale={locale}
            heading={t.youMightAlsoLike}
            models={recommended}
            fromLabel={t.from}
            notifyLabel={t.notifyMe}
          />
        </>
      )}
    </main>
  );
}
