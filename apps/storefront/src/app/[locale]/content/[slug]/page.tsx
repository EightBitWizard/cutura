import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buildAlternates } from "@cutura/core";
import { getDb, getPublishedContentPage } from "@cutura/db";

import { defaultLocale, isLocale, locales } from "@/i18n/config";
import { getEnv } from "@/server/env";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const page = await getPublishedContentPage(getDb(getEnv().DB), slug, locale);
  if (!page) return {};
  return {
    title: page.title,
    alternates: buildAlternates(`/content/${slug}`, locale, locales, defaultLocale),
  };
}

export default async function ContentPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const page = await getPublishedContentPage(getDb(getEnv().DB), slug, locale);
  if (!page) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">{page.title}</h1>
      <div className="mt-6 whitespace-pre-wrap text-ink">{page.body}</div>
    </main>
  );
}
