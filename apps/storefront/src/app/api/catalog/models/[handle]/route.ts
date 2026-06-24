import { getDb, getPublishedModel } from "@cutura/db";

import { defaultLocale, isLocale } from "@/i18n/config";
import { getEnv } from "@/server/env";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ handle: string }> },
): Promise<Response> {
  const { handle } = await params;
  const raw = new URL(request.url).searchParams.get("locale") ?? defaultLocale;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const model = await getPublishedModel(getDb(getEnv().DB), handle, locale);
  if (!model) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ model });
}
