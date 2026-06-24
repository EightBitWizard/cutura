import type { Metadata } from "next";
import Link from "next/link";

import { buildAlternates, formatCHF } from "@cutura/core";
import {
  type DiscoveryFilter,
  getDb,
  listAttributeFacets,
  listPublishedModelsFiltered,
  primaryMediaForEntities,
} from "@cutura/db";

import { MediaImage } from "@/components/MediaImage";
import { defaultLocale, isLocale, locales } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { getEnv } from "@/server/env";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  return {
    title: getMessages(locale).discoverTitle,
    alternates: buildAlternates("/discover", locale, locales, defaultLocale),
  };
}

function asArray(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

export default async function DiscoverPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getMessages(locale);
  const sp = await searchParams;
  const db = getDb(getEnv().DB);

  const facets = await listAttributeFacets(db, locale);
  const attributes: Record<string, string[]> = {};
  for (const f of facets) {
    const selected = asArray(sp[f.key]);
    if (selected.length) attributes[f.key] = selected;
  }
  const sortRaw = typeof sp.sort === "string" ? sp.sort : "";
  const sort: DiscoveryFilter["sort"] =
    sortRaw === "price_asc" || sortRaw === "price_desc" || sortRaw === "name" ? sortRaw : undefined;
  const orderableOnly = sp.orderable === "1";

  const models = await listPublishedModelsFiltered(db, locale, { attributes, sort, orderableOnly });
  const mediaByModel = await primaryMediaForEntities(
    db,
    "model",
    models.map((m) => m.id),
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">{t.discoverTitle}</h1>

      <form method="get" className="mt-6 grid gap-6 sm:grid-cols-[16rem_1fr]">
        <aside className="flex flex-col gap-4 text-sm">
          <div>
            <p className="font-medium">{t.sortLabel}</p>
            <select
              name="sort"
              defaultValue={sortRaw}
              className="mt-1 w-full rounded border border-neutral-300 px-2 py-1"
            >
              <option value="">-</option>
              <option value="price_asc">{t.sortPriceAsc}</option>
              <option value="price_desc">{t.sortPriceDesc}</option>
              <option value="name">{t.sortName}</option>
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="orderable" value="1" defaultChecked={orderableOnly} />
            {t.orderableOnly}
          </label>

          {facets.map((f) => (
            <div key={f.key}>
              <p className="font-medium">{f.label}</p>
              <div className="mt-1 flex flex-col gap-1">
                {f.values.map((v) => (
                  <label key={v.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name={f.key}
                      value={v.value}
                      defaultChecked={(attributes[f.key] ?? []).includes(v.value)}
                    />
                    {v.value} ({v.count})
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white"
          >
            {t.apply}
          </button>
        </aside>

        <section>
          {models.length === 0 ? (
            <p className="text-neutral-500">{t.noResults}</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {models.map((m) => (
                <Link
                  key={m.handle}
                  href={`/${locale}/products/${m.handle}`}
                  className="flex flex-col rounded-lg border border-neutral-200 p-4 hover:border-neutral-400"
                >
                  <MediaImage
                    mediaId={mediaByModel.get(m.id) ?? null}
                    alt={m.name}
                    className="mb-3 aspect-square w-full rounded bg-neutral-100 object-cover"
                  />
                  <span className="font-medium">{m.name}</span>
                  <span className="mt-1 text-sm text-neutral-500">
                    {t.from} {formatCHF(m.basePriceMinor)}
                  </span>
                  {m.status === "view_only" && (
                    <span className="mt-1 text-xs text-neutral-400">{t.notifyMe}</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>
      </form>
    </main>
  );
}
