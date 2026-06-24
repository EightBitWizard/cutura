import { getDb, listPublishedModels } from "@cutura/db";

import { defaultLocale, isLocale } from "@/i18n/config";
import { getEnv } from "@/server/env";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const raw = new URL(request.url).searchParams.get("locale") ?? defaultLocale;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const models = await listPublishedModels(getDb(getEnv().DB), locale);
  return Response.json({ models });
}
