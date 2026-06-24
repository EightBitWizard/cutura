import type { Metadata } from "next";

import { buildAlternates } from "@cutura/core";
import { getDb, listPublishedModelsFiltered, primaryMediaForEntities } from "@cutura/db";

import { ModelGrid } from "@/components/ModelGrid";
import { defaultLocale, isLocale, locales } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { getEnv } from "@/server/env";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; value: string }>;
}): Promise<Metadata> {
  const { locale: raw, value } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  return {
    title: value,
    alternates: buildAlternates(`/occasions/${value}`, locale, locales, defaultLocale),
  };
}

// Occasion browsing (FR-340): the discovery results preset by the occasion attribute.
export default async function OccasionPage({
  params,
}: {
  params: Promise<{ locale: string; value: string }>;
}) {
  const { locale: raw, value } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getMessages(locale);
  const db = getDb(getEnv().DB);
  const models = await listPublishedModelsFiltered(db, locale, {
    attributes: { occasion: [value] },
  });
  const mediaByModel = await primaryMediaForEntities(
    db,
    "model",
    models.map((m) => m.id),
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold capitalize tracking-tight">{value}</h1>
      <div className="mt-6">
        {models.length === 0 ? (
          <p className="text-neutral-500">{t.noResults}</p>
        ) : (
          <ModelGrid
            models={models}
            mediaByModel={mediaByModel}
            locale={locale}
            fromLabel={t.from}
            notifyLabel={t.notifyMe}
          />
        )}
      </div>
    </main>
  );
}
