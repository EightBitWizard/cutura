import { collection, getRow, media, saveRow, writeAudit } from "@cutura/db";

import { controlDb } from "@/server/catalog";
import { getEnv } from "@/server/env";
import { seeOther } from "@/server/http";
import { isAllowedImageType } from "@/server/media";

export const dynamic = "force-dynamic";

// Upload a collection banner (FR-2D0): store the raster image, create a media row,
// and point collection.bannerMediaId at it.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const env = getEnv();
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0)
    return seeOther(`/collections/${id}?error=upload`);
  if (!isAllowedImageType(file.type)) return seeOther(`/collections/${id}?error=filetype`);

  const db = controlDb();
  const col = await getRow(db, collection, id);
  if (!col) return seeOther("/collections?error=notfound");

  const mediaId = crypto.randomUUID();
  const key = `media/collection/${id}/${mediaId}`;
  await env.MEDIA_CONTROL.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });
  const now = new Date().toISOString();
  await saveRow(db, media, {
    id: mediaId,
    r2Key: key,
    entityType: "collection",
    entityId: id,
    alt: null,
    kind: "banner",
    position: 0,
    isPrimary: true,
    createdAt: now,
    updatedAt: now,
  });
  await saveRow(db, collection, { ...col, bannerMediaId: mediaId, updatedAt: now });
  await writeAudit(db, {
    actor: "admin",
    action: "catalog.collection.banner",
    entityType: "collection",
    entityId: id,
  });
  return seeOther(`/collections/${id}?banner=1`);
}
