import { getRow, media } from "@cutura/db";

import { controlDb } from "@/server/catalog";
import { getEnv } from "@/server/env";

export const dynamic = "force-dynamic";

// Authenticated preview of a control-database media object (admin only; the
// middleware gates this route). Public storefront media serving is a go-live
// refinement (Cloudflare Images / public R2).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const row = await getRow(controlDb(), media, id);
  if (!row) return new Response("not found", { status: 404 });

  const object = await getEnv().MEDIA_CONTROL.get(row.r2Key);
  if (!object) return new Response("not found", { status: 404 });

  const headers = new Headers();
  const contentType = object.httpMetadata?.contentType;
  if (contentType) headers.set("Content-Type", contentType);
  headers.set("Cache-Control", "private, max-age=60");
  // R2's ReadableStream comes from @cloudflare/workers-types; cast to the
  // platform BodyInit (they are structurally the same stream at runtime).
  return new Response(object.body as unknown as BodyInit, { headers });
}
