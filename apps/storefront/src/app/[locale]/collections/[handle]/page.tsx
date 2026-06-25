import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buildAlternates } from "@cutura/core";
import { getDb, getPublishedCollection, primaryMediaForEntities } from "@cutura/db";

import { MediaImage } from "@/components/MediaImage";
import { ModelGrid } from "@/components/ModelGrid";
import { defaultLocale, isLocale, locales } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { getEnv } from "@/server/env";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>;
}): Promise<Metadata> {
  const { locale: raw, handle } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const col = await getPublishedCollection(getDb(getEnv().DB), handle, locale);
  if (!col) return {};
  return {
    title: col.name,
    description: col.description || undefined,
    alternates: buildAlternates(`/collections/${handle}`, locale, locales, defaultLocale),
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>;
}) {
  const { locale: raw, handle } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getMessages(locale);
  const db = getDb(getEnv().DB);
  const col = await getPublishedCollection(db, handle, locale);
  if (!col) notFound();

  const mediaByModel = await primaryMediaForEntities(
    db,
    "model",
    col.models.map((m) => m.id),
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {col.bannerMediaId && (
        <MediaImage
          mediaId={col.bannerMediaId}
          alt={col.name}
          className="mb-6 aspect-[3/1] w-full rounded-lg bg-sunken object-cover"
        />
      )}
      <h1 className="text-3xl font-semibold tracking-tight">{col.name}</h1>
      {col.description && <p className="mt-2 text-ink-muted">{col.description}</p>}

      <div className="mt-6">
        {col.models.length === 0 ? (
          <p className="text-ink-subtle">{t.noResults}</p>
        ) : (
          <ModelGrid
            models={col.models}
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
