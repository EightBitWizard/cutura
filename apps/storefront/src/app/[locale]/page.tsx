import Link from "next/link";

import { formatCHF } from "@cutura/core";
import {
  getDb,
  listPublishedCollections,
  listPublishedModels,
  primaryMediaForEntities,
} from "@cutura/db";

import { MediaImage } from "@/components/MediaImage";
import { defaultLocale, isLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { getEnv } from "@/server/env";

export const dynamic = "force-dynamic";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getMessages(locale);
  const db = getDb(getEnv().DB);
  const [models, collections] = await Promise.all([
    listPublishedModels(db, locale),
    listPublishedCollections(db, locale),
  ]);
  const mediaByModel = await primaryMediaForEntities(
    db,
    "model",
    models.map((m) => m.id),
  );
  const modelByHandle = new Map(models.map((m) => [m.handle, m]));

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight">{t.brand}</h1>
        <p className="mt-3 text-lg text-neutral-600">{t.tagline}</p>
      </header>

      {collections.map((c) => (
        <section key={c.handle} className="mt-12">
          <h2 className="text-xl font-medium">{c.name}</h2>
          {c.description && <p className="mt-1 text-neutral-600">{c.description}</p>}
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {c.modelHandles
              .map((h) => modelByHandle.get(h))
              .filter((m): m is NonNullable<typeof m> => m !== undefined)
              .map((m) => (
                <ModelCard
                  key={m.handle}
                  locale={locale}
                  from={t.from}
                  view={t.view}
                  model={m}
                  mediaId={mediaByModel.get(m.id) ?? null}
                />
              ))}
          </div>
        </section>
      ))}

      <section className="mt-12">
        <h2 className="text-xl font-medium">{t.allModels}</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {models.map((m) => (
            <ModelCard
              key={m.handle}
              locale={locale}
              from={t.from}
              view={t.view}
              model={m}
              mediaId={mediaByModel.get(m.id) ?? null}
            />
          ))}
        </div>
        {models.length === 0 && <p className="mt-2 text-neutral-500">{t.allModels}: 0</p>}
      </section>
    </main>
  );
}

function ModelCard({
  model,
  locale,
  from,
  view,
  mediaId,
}: {
  model: { handle: string; name: string; basePriceMinor: number };
  locale: string;
  from: string;
  view: string;
  mediaId: string | null;
}) {
  return (
    <Link
      href={`/${locale}/products/${model.handle}`}
      className="flex flex-col rounded-lg border border-neutral-200 p-4 hover:border-neutral-400"
    >
      <MediaImage
        mediaId={mediaId}
        alt={model.name}
        className="mb-3 aspect-square w-full rounded bg-neutral-100 object-cover"
      />
      <span className="font-medium">{model.name}</span>
      <span className="mt-1 text-sm text-neutral-500">
        {from} {formatCHF(model.basePriceMinor)}
      </span>
      <span className="mt-3 text-sm font-medium text-neutral-900 underline">{view}</span>
    </Link>
  );
}
