import type { Metadata } from "next";

import { buildAlternates } from "@cutura/core";
import {
  type DiscoveryFilter,
  getDb,
  listAttributeFacets,
  listPublishedModelsFiltered,
  primaryMediaForEntities,
} from "@cutura/db";

import { ModelGrid } from "@/components/ModelGrid";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
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

  const checkbox = "h-4 w-4 accent-ink";

  return (
    <Container className="py-10 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">{t.discoverTitle}</h1>

      <form method="get" className="mt-8 grid gap-10 sm:grid-cols-[15rem_1fr]">
        <aside className="flex flex-col gap-6 text-sm">
          <div>
            <Eyebrow>{t.sortLabel}</Eyebrow>
            <select
              name="sort"
              defaultValue={sortRaw}
              className="mt-2 w-full rounded-sm border border-line-strong bg-surface px-3 py-2 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-paper"
            >
              <option value="">-</option>
              <option value="price_asc">{t.sortPriceAsc}</option>
              <option value="price_desc">{t.sortPriceDesc}</option>
              <option value="name">{t.sortName}</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-ink">
            <input
              type="checkbox"
              name="orderable"
              value="1"
              defaultChecked={orderableOnly}
              className={checkbox}
            />
            {t.orderableOnly}
          </label>

          {facets.map((f) => (
            <div key={f.key}>
              <Eyebrow>{f.label}</Eyebrow>
              <div className="mt-2 flex flex-col gap-2">
                {f.values.map((v) => (
                  <label key={v.value} className="flex items-center gap-2 text-ink">
                    <input
                      type="checkbox"
                      name={f.key}
                      value={v.value}
                      defaultChecked={(attributes[f.key] ?? []).includes(v.value)}
                      className={checkbox}
                    />
                    {v.value} <span className="text-ink-subtle">({v.count})</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button type="submit" className={buttonClasses("primary", "md", "w-full")}>
            {t.apply}
          </button>
        </aside>

        <section>
          {models.length === 0 ? (
            <p className="text-ink-muted">{t.noResults}</p>
          ) : (
            <ModelGrid
              models={models}
              mediaByModel={mediaByModel}
              locale={locale}
              fromLabel={t.from}
              notifyLabel={t.notifyMe}
            />
          )}
        </section>
      </form>
    </Container>
  );
}
