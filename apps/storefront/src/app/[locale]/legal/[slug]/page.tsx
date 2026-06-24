import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buildAlternates } from "@cutura/core";
import { getDb, getPublishedContentPage } from "@cutura/db";

import { defaultLocale, isLocale, locales } from "@/i18n/config";
import { getEnv } from "@/server/env";

export const dynamic = "force-dynamic";

// Known legal slugs render a calm placeholder before the founder seeds the final,
// lawyer-reviewed text (M7), so legal links never 404.
const KNOWN_LEGAL = ["terms", "privacy", "imprint", "shipping", "fit-guarantee"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const page = await getPublishedContentPage(getDb(getEnv().DB), slug, locale);
  return {
    title: page?.title ?? slug,
    alternates: buildAlternates(`/legal/${slug}`, locale, locales, defaultLocale),
  };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const page = await getPublishedContentPage(getDb(getEnv().DB), slug, locale);

  if (!page) {
    if (!KNOWN_LEGAL.includes(slug)) notFound();
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">{slug}</h1>
        <p className="mt-6 text-neutral-500">This page is being finalized.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">{page.title}</h1>
      <div className="mt-6 whitespace-pre-wrap text-neutral-700">{page.body}</div>
    </main>
  );
}
