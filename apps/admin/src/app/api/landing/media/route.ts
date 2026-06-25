import { deleteRow, listMedia, media, saveRow, writeAudit } from "@cutura/db";

import { environmentDb, parseEnvironment } from "@/server/catalog";
import { getEnv } from "@/server/env";
import { safePath, seeOther } from "@/server/http";
import { isAllowedImageType } from "@/server/media";

export const dynamic = "force-dynamic";

const SLOTS = new Set(["hero", "fabric", "workshop"]);

// Env-direct landing image upload (one image per slot, replace on upload). Writes the
// object to the chosen environment's R2 bucket and the media row to its DB, so it shows
// on that storefront immediately. No catalog publish step. Slot = hero|fabric|workshop.
export async function POST(request: Request): Promise<Response> {
  const env = getEnv();
  const form = await request.formData();
  const file = form.get("file");
  const slot = String(form.get("slot") ?? "").trim();
  const environment = parseEnvironment(form.get("environment"));
  const back = safePath(form.get("back"), "/landing");

  if (!SLOTS.has(slot)) return seeOther(`${back}?env=${environment}&error=slot`);
  if (!(file instanceof File) || file.size === 0)
    return seeOther(`${back}?env=${environment}&error=upload`);
  if (!isAllowedImageType(file.type)) return seeOther(`${back}?env=${environment}&error=filetype`);

  const db = environmentDb(environment);
  const bucket = environment === "production" ? env.MEDIA_PRODUCTION : env.MEDIA_STAGING;

  // Replace: remove any existing image (row + object) for this slot in this env.
  for (const row of await listMedia(db, "landing", slot)) {
    await bucket.delete(row.r2Key);
    await deleteRow(db, media, row.id);
  }

  const id = crypto.randomUUID();
  const key = `media/landing/${slot}/${id}`;
  await bucket.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  const now = new Date().toISOString();
  await saveRow(db, media, {
    id,
    r2Key: key,
    entityType: "landing",
    entityId: slot,
    alt: String(form.get("alt") ?? "").trim() || null,
    kind: "image",
    position: 0,
    isPrimary: true,
    createdAt: now,
    updatedAt: now,
  });
  await writeAudit(db, {
    actor: "admin",
    action: "landing.media.upload",
    entityType: "media",
    entityId: id,
  });
  return seeOther(`${back}?env=${environment}&uploaded=1`);
}
