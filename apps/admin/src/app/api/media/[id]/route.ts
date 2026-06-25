import { getRow, media } from "@cutura/db";

import { controlDb, environmentDb } from "@/server/catalog";
import { getEnv } from "@/server/env";
import { isAllowedImageType } from "@/server/media";

export const dynamic = "force-dynamic";

// Authenticated preview of a media object (admin only; the middleware gates this
// route). Defaults to the control database/bucket (catalog drafts); pass
// `?env=staging|production` to preview an env-direct image (e.g. landing-page media).
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const envParam = new URL(request.url).searchParams.get("env");
  const useEnv = envParam === "staging" || envParam === "production";
  const db = useEnv ? environmentDb(envParam) : controlDb();
  const bucket = useEnv
    ? envParam === "production"
      ? getEnv().MEDIA_PRODUCTION
      : getEnv().MEDIA_STAGING
    : getEnv().MEDIA_CONTROL;

  const row = await getRow(db, media, id);
  if (!row) return new Response("not found", { status: 404 });

  const object = await bucket.get(row.r2Key);
  if (!object) return new Response("not found", { status: 404 });

  // Force a safe content-type: serve only allow-listed raster image types inline;
  // anything else (e.g. a smuggled SVG/HTML) is served as an opaque download.
  // nosniff + a locked-down CSP prevent the browser from executing it (XSS).
  const stored = object.httpMetadata?.contentType;
  const safe = isAllowedImageType(stored);
  const headers = new Headers();
  headers.set("Content-Type", safe ? (stored as string) : "application/octet-stream");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Content-Security-Policy", "default-src 'none'; sandbox");
  headers.set("Cache-Control", "private, max-age=60");
  if (!safe) headers.set("Content-Disposition", `attachment; filename="media-${id}"`);
  // R2's ReadableStream comes from @cloudflare/workers-types; cast to the
  // platform BodyInit (they are structurally the same stream at runtime).
  return new Response(object.body as unknown as BodyInit, { headers });
}
