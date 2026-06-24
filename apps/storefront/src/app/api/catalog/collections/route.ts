import { getDb, listPublishedCollections } from "@cutura/db";

import { defaultLocale, isLocale } from "@/i18n/config";
import { getEnv } from "@/server/env";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const raw = new URL(request.url).searchParams.get("locale") ?? defaultLocale;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const collections = await listPublishedCollections(getDb(getEnv().DB), locale);
  return Response.json({ collections });
}
