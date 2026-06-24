import { listMedia, media, saveRow, writeAudit } from "@cutura/db";

import { controlDb } from "@/server/catalog";
import { getEnv } from "@/server/env";
import { safePath, seeOther } from "@/server/http";
import { isAllowedImageType } from "@/server/media";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const env = getEnv();
  const form = await request.formData();
  const file = form.get("file");
  const entityType = String(form.get("entityType") ?? "").trim();
  const entityId = String(form.get("entityId") ?? "").trim();
  const back = safePath(form.get("back"));
  if (!(file instanceof File) || file.size === 0 || !entityType || !entityId) {
    return seeOther(`${back}?error=upload`);
  }
  // Reject anything that is not an allow-listed raster image (no SVG/HTML), so a
  // script-bearing file can never be stored or later served (XSS defense in depth).
  if (!isAllowedImageType(file.type)) {
    return seeOther(`${back}?error=filetype`);
  }

  const id = crypto.randomUUID();
  const key = `media/${entityType}/${entityId}/${id}`;
  await env.MEDIA_CONTROL.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  const db = controlDb();
  const existing = await listMedia(db, entityType, entityId);
  const now = new Date().toISOString();
  await saveRow(db, media, {
    id,
    r2Key: key,
    entityType,
    entityId,
    alt: String(form.get("alt") ?? "").trim() || null,
    kind: "image",
    position: existing.length,
    isPrimary: existing.length === 0,
    createdAt: now,
    updatedAt: now,
  });
  await writeAudit(db, {
    actor: "admin",
    action: "catalog.media.upload",
    entityType: "media",
    entityId: id,
  });
  return seeOther(`${back}?uploaded=1`);
}
