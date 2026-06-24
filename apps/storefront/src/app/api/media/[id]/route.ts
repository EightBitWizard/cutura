import { isAllowedImageType } from "@cutura/core";
import { getDb, getRow, media } from "@cutura/db";

import { getEnv } from "@/server/env";

export const dynamic = "force-dynamic";

// Public catalog media serving. Mirrors the admin safe serve: only allow-listed
// raster types are served inline; anything else (e.g. a smuggled SVG/HTML) is an
// opaque download, with nosniff + a locked-down CSP so the browser never executes
// it (stored XSS defense). Reads the published media row from the env DB and the
// object from the env MEDIA bucket.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const env = getEnv();
  const row = await getRow(getDb(env.DB), media, id);
  if (!row) return new Response("not found", { status: 404 });

  const object = await env.MEDIA.get(row.r2Key);
  if (!object) return new Response("not found", { status: 404 });

  const stored = object.httpMetadata?.contentType;
  const safe = isAllowedImageType(stored);
  const headers = new Headers();
  headers.set("Content-Type", safe ? (stored as string) : "application/octet-stream");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Content-Security-Policy", "default-src 'none'; sandbox");
  headers.set("Cache-Control", "public, max-age=300");
  if (!safe) headers.set("Content-Disposition", `attachment; filename="media-${id}"`);
  return new Response(object.body as unknown as BodyInit, { headers });
}
