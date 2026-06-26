import type { Metadata } from "next";

import Link from "next/link";
import { notFound } from "next/navigation";

import { buildAlternates, buildProductJsonLd } from "@cutura/core";
import {
  getCrossSellSuggestions,
  getDb,
  getEntityGallery,
  getPublishedModel,
  getRecommendations,
  primaryMediaForEntities,
} from "@cutura/db";

import { Configurator } from "@/components/Configurator";
import { ModelGrid } from "@/components/ModelGrid";
import { ProductGallery } from "@/components/ProductGallery";
import { RecommendedSection } from "@/components/RecommendedSection";
import { ViewSignal } from "@/components/ViewSignal";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Price } from "@/components/ui/Price";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { defaultLocale, isLocale, locales } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { getEnv } from "@/server/env";
import { getOrderingState, leadTimeFor } from "@/server/ops";
import { getCustomerId } from "@/server/session";

export const dynamic = "force-dynamic";

// Render a fibre composition (object like {cotton: 100}, a string, or nothing).
function fibreText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => (typeof v === "number" ? `${v}% ${k}` : `${k}: ${String(v)}`))
      .join(", ");
  }
  return "";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>;
}): Promise<Metadata> {
  const { locale: raw, handle } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const model = await getPublishedModel(getDb(getEnv().DB), handle, locale);
  if (!model) return {};
  return {
    title: model.name,
    description: model.description ?? undefined,
    alternates: buildAlternates(`/products/${handle}`, locale, locales, defaultLocale),
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; handle: string }>;
  searchParams: Promise<{ notify?: string }>;
}) {
  const { locale: raw, handle } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const { notify } = await searchParams;
  const t = getMessages(locale);
  const db = getDb(getEnv().DB);
  const model = await getPublishedModel(db, handle, locale);
  if (!model) notFound();

  const gallery = await getEntityGallery(db, "model", model.id);
  const suggestions = await getCrossSellSuggestions(db, locale, {
    id: model.id,
    handle: model.handle,
  });
  const suggestionMedia = await primaryMediaForEntities(
    db,
    "model",
    suggestions.map((s) => s.id),
  );
  const customerId = await getCustomerId();
  const recommended = await getRecommendations(db, locale, {
    sourceModelIds: [model.id],
    customerId,
    excludeIds: suggestions.map((s) => s.id),
    limit: 4,
  });
  const ordering = await getOrderingState(locale);
  const lead = leadTimeFor(ordering, model.leadTimeMinDays, model.leadTimeMaxDays);
  const garmentName = t.garmentNames[model.garmentType as "shirt" | "trouser"] ?? "";

  const materials = model.fabrics.filter((f) => fibreText(f.fibreComposition));

  const jsonLd = buildProductJsonLd({
    name: model.name,
    description: model.description || undefined,
    priceMinor: model.basePriceMinor,
    currency: "CHF",
    availability: model.status === "orderable" ? "InStock" : "PreOrder",
  });

  return (
    <main>
      <script
        type="application/ld+json"
        // Structured data (NFR-20). Catalog-controlled content; "<" is escaped to
        // < so a value containing </script> cannot break out of the tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ViewSignal entityId={model.id} />

      <Container className="py-8 sm:py-12">
        <Link
          href={`/${locale}`}
          className="text-sm text-ink-muted transition-colors hover:text-ink"
        >
          {t.back}
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Images, left, carry the page */}
          <ProductGallery images={gallery} name={model.name} />

          {/* Details + configurator, sticky on desktop */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {garmentName ? <Eyebrow>{garmentName}</Eyebrow> : null}
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">{model.name}</h1>
            {model.description && (
              <p className="mt-3 whitespace-pre-line text-ink-muted">{model.description}</p>
            )}

            <p className="mt-5 flex items-baseline gap-2">
              <span className="text-xl font-semibold text-ink">
                {t.from} <Price minor={model.basePriceMinor} />
              </span>
              <span className="text-eyebrow uppercase text-ink-subtle">{t.allInclusive}</span>
            </p>
            <p className="mt-1 text-sm text-ink-subtle">{t.leadTime(lead.minDays, lead.maxDays)}</p>

            {materials.length > 0 && (
              <section className="mt-6 border-t border-line pt-5">
                <h2 className="text-eyebrow uppercase text-ink-subtle">{t.materials}</h2>
                <ul className="mt-2 space-y-1 text-sm text-ink-muted">
                  {materials.map((f) => (
                    <li key={f.code}>
                      {f.name}: {fibreText(f.fibreComposition)}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {ordering.paused && model.status !== "view_only" && (
              <div className="mt-6 rounded-md border border-line bg-sunken px-4 py-3 text-sm text-ink">
                {ordering.message}
              </div>
            )}

            {model.status === "view_only" ? (
              <div className="mt-8 rounded-md border border-line bg-surface p-5">
                <p className="text-ink">{t.viewOnlyNotice}</p>
                {notify === "ok" ? (
                  <p className="mt-3 text-sm text-success">{t.notifyThanks}</p>
                ) : (
                  <form method="post" action="/api/notify-me" className="mt-4 flex flex-wrap gap-2">
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="handle" value={handle} />
                    <input type="hidden" name="entityType" value="model" />
                    <input type="hidden" name="entityId" value={model.id} />
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      className="flex-1 rounded-sm border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-paper"
                    />
                    <button type="submit" className={buttonClasses("primary", "md")}>
                      {t.notifyMe}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <Configurator
                model={model}
                locale={locale}
                paused={ordering.paused}
                messages={{
                  fabric: t.fabric,
                  options: t.options,
                  upgrades: t.upgrades,
                  required: t.required,
                  none: t.none,
                  total: t.total,
                  allInclusive: t.allInclusive,
                  selectRequired: t.selectRequired,
                  addToCart: t.addToCart,
                  recalculating: t.recalculating,
                }}
              />
            )}
          </div>
        </div>

        {suggestions.length > 0 && (
          <section className="mt-20">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">{t.youMightAlsoLike}</h2>
            <div className="mt-8">
              <ModelGrid
                models={suggestions}
                mediaByModel={suggestionMedia}
                locale={locale}
                fromLabel={t.from}
                notifyLabel={t.notifyMe}
              />
            </div>
          </section>
        )}

        {recommended.length > 0 && (
          <div className="mt-4">
            <RecommendedSection
              locale={locale}
              heading={t.recommendedForYou}
              models={recommended}
              fromLabel={t.from}
              notifyLabel={t.notifyMe}
            />
          </div>
        )}
      </Container>
    </main>
  );
}
