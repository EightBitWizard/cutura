import { eq } from "drizzle-orm";

import type { Database } from "../getDb";
import { type Locale, type LocalizedText, contentPage } from "../schema";

function localize(text: LocalizedText | null, locale: Locale): string {
  return text?.[locale] ?? text?.de ?? "";
}

export interface PublishedContentPage {
  slug: string;
  kind: "content" | "legal";
  title: string;
  body: string;
  version: number;
}

/** A published content/legal page by slug, localized. Null if not published. */
export async function getPublishedContentPage(
  db: Database,
  slug: string,
  locale: Locale,
): Promise<PublishedContentPage | null> {
  const [row] = await db.select().from(contentPage).where(eq(contentPage.slug, slug));
  if (!row) return null;
  return {
    slug: row.slug,
    kind: row.kind,
    title: localize(row.titleI18n, locale),
    body: localize(row.bodyI18n, locale),
    version: row.version,
  };
}

/** Published content pages (optionally by kind), localized titles, for nav/footer. */
export async function listPublishedContentPages(
  db: Database,
  locale: Locale,
  kind?: "content" | "legal",
): Promise<Array<{ slug: string; kind: "content" | "legal"; title: string }>> {
  const rows = await db.select().from(contentPage);
  return rows
    .filter((r) => !kind || r.kind === kind)
    .map((r) => ({ slug: r.slug, kind: r.kind, title: localize(r.titleI18n, locale) }));
}
