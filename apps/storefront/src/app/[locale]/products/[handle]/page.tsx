import type { Metadata } from "next";

import Link from "next/link";
import { notFound } from "next/navigation";

import { buildAlternates, buildProductJsonLd, formatCHF } from "@cutura/core";
import {
  getCrossSellSuggestions,
  getDb,
  getPrimaryMediaId,
  getPublishedModel,
  primaryMediaForEntities,
} from "@cutura/db";

import { Configurator } from "@/components/Configurator";
import { MediaImage } from "@/components/MediaImage";
import { ModelGrid } from "@/components/ModelGrid";
import { ViewSignal } from "@/components/ViewSignal";
import { defaultLocale, isLocale, locales } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { getEnv } from "@/server/env";
import { getOrderingState, leadTimeFor } from "@/server/ops";

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

  const mediaId = await getPrimaryMediaId(db, "model", model.id);
  const suggestions = await getCrossSellSuggestions(db, locale, {
    id: model.id,
    handle: model.handle,
  });
  const suggestionMedia = await primaryMediaForEntities(
    db,
    "model",
    suggestions.map((s) => s.id),
  );
  const ordering = await getOrderingState(locale);
  const lead = leadTimeFor(ordering, model.leadTimeMinDays, model.leadTimeMaxDays);

  const jsonLd = buildProductJsonLd({
    name: model.name,
    description: model.description || undefined,
    priceMinor: model.basePriceMinor,
    currency: "CHF",
    availability: model.status === "orderable" ? "InStock" : "PreOrder",
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <script
        type="application/ld+json"
        // Structured data (NFR-20). Catalog-controlled content; "<" is escaped to
        // < so a value containing </script> cannot break out of the tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ViewSignal entityId={model.id} />
      <Link href={`/${locale}`} className="text-sm text-neutral-500 underline">
        {t.back}
      </Link>

      <MediaImage
        mediaId={mediaId}
        alt={model.name}
        className="mt-4 aspect-[4/3] w-full rounded-lg bg-neutral-100 object-cover"
      />

      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{model.name}</h1>
      {model.description && <p className="mt-3 text-neutral-600">{model.description}</p>}

      <p className="mt-4 text-lg">
        {t.from} {formatCHF(model.basePriceMinor)}{" "}
        <span className="text-sm text-neutral-400">{t.allInclusive}</span>
      </p>
      <p className="mt-1 text-sm text-neutral-500">{t.leadTime(lead.minDays, lead.maxDays)}</p>

      {model.fabrics.some((f) => fibreText(f.fibreComposition)) && (
        <section className="mt-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500">
            {t.materials}
          </h2>
          <ul className="mt-1 text-sm text-neutral-600">
            {model.fabrics
              .filter((f) => fibreText(f.fibreComposition))
              .map((f) => (
                <li key={f.code}>
                  {f.name}: {fibreText(f.fibreComposition)}
                </li>
              ))}
          </ul>
        </section>
      )}

      {ordering.paused && model.status !== "view_only" && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-amber-800">{ordering.message}</p>
        </div>
      )}

      {model.status === "view_only" ? (
        <div className="mt-8 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-neutral-700">{t.viewOnlyNotice}</p>
          {notify === "ok" ? (
            <p className="mt-3 text-sm text-green-700">{t.notifyThanks}</p>
          ) : (
            <form method="post" action="/api/notify-me" className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="handle" value={handle} />
              <input type="hidden" name="entityType" value="model" />
              <input type="hidden" name="entityId" value={model.id} />
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="rounded border border-neutral-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
              >
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

      {suggestions.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-medium">{t.youMightAlsoLike}</h2>
          <div className="mt-4">
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
    </main>
  );
}
