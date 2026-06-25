import type { Metadata } from "next";
import Link from "next/link";

import { buildAlternates } from "@cutura/core";
import {
  getDb,
  listPublishedContentPages,
  listPublishedModels,
  primaryMediaForEntities,
} from "@cutura/db";

import { ModelGrid } from "@/components/ModelGrid";
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
    title: getMessages(locale).searchTitle,
    alternates: buildAlternates("/search", locale, locales, defaultLocale),
  };
}

// Localized global search (FR-350): a case-insensitive match over published model
// names and content/legal page titles (launch catalog is small).
export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getMessages(locale);
  const q = ((await searchParams).q ?? "").trim();
  const needle = q.toLowerCase();
  const db = getDb(getEnv().DB);

  const [allModels, allPages] = q
    ? await Promise.all([listPublishedModels(db, locale), listPublishedContentPages(db, locale)])
    : [[], []];
  const models = allModels.filter((m) => m.name.toLowerCase().includes(needle));
  const pages = allPages.filter((p) => p.title.toLowerCase().includes(needle));
  const mediaByModel = await primaryMediaForEntities(
    db,
    "model",
    models.map((m) => m.id),
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">{t.searchTitle}</h1>
      <form method="get" className="mt-4">
        <input
          name="q"
          defaultValue={q}
          placeholder={t.searchPlaceholder}
          className="w-full max-w-md rounded border border-line-strong px-3 py-2"
        />
      </form>

      {q && (
        <div className="mt-6">
          {models.length === 0 && pages.length === 0 ? (
            <p className="text-ink-subtle">{t.noResults}</p>
          ) : (
            <>
              {models.length > 0 && (
                <ModelGrid
                  models={models}
                  mediaByModel={mediaByModel}
                  locale={locale}
                  fromLabel={t.from}
                  notifyLabel={t.notifyMe}
                />
              )}
              {pages.length > 0 && (
                <ul className="mt-6 flex flex-col gap-1 text-sm">
                  {pages.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/${locale}/${p.kind === "legal" ? "legal" : "content"}/${p.slug}`}
                        className="underline"
                      >
                        {p.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </main>
  );
}
