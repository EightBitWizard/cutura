import type { Metadata } from "next";

import Link from "next/link";
import { notFound } from "next/navigation";

import { buildAlternates, formatCHF } from "@cutura/core";
import { getDb, getPrimaryMediaId, getPublishedModel } from "@cutura/db";

import { Configurator } from "@/components/Configurator";
import { MediaImage } from "@/components/MediaImage";
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
}: {
  params: Promise<{ locale: string; handle: string }>;
}) {
  const { locale: raw, handle } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getMessages(locale);
  const db = getDb(getEnv().DB);
  const model = await getPublishedModel(db, handle, locale);
  if (!model) notFound();

  const mediaId = await getPrimaryMediaId(db, "model", model.id);
  const ordering = await getOrderingState(locale);
  const lead = leadTimeFor(ordering, model.leadTimeMinDays, model.leadTimeMaxDays);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
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
    </main>
  );
}
