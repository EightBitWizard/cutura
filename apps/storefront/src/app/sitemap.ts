import type { MetadataRoute } from "next";

import { getDb, listPublishedCollections, listPublishedModels } from "@cutura/db";

import { defaultLocale, locales } from "@/i18n/config";
import { getEnv } from "@/server/env";
import { SITE_URL } from "@/site";

export const dynamic = "force-dynamic";

// Localized sitemap (FR-1270): one entry per path with hreflang alternates for all
// four locales, the default-locale URL as the entry url.
function entry(path: string): MetadataRoute.Sitemap[number] {
  const clean = path === "/" ? "" : path;
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = `${SITE_URL}/${l}${clean}`;
  return {
    url: `${SITE_URL}/${defaultLocale}${clean}`,
    alternates: { languages },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = getDb(getEnv().DB);
  const [models, collections] = await Promise.all([
    listPublishedModels(db, defaultLocale),
    listPublishedCollections(db, defaultLocale),
  ]);

  const paths = [
    "/",
    "/discover",
    ...collections.map((c) => `/collections/${c.handle}`),
    ...models.map((m) => `/products/${m.handle}`),
  ];
  return paths.map(entry);
}
