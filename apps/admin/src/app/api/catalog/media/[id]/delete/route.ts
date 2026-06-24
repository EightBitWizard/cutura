import { deleteRow, getRow, media, writeAudit } from "@cutura/db";

import { controlDb } from "@/server/catalog";
import { getEnv } from "@/server/env";
import { safePath, seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const form = await request.formData();
  const back = safePath(form.get("back"));
  const db = controlDb();
  const row = await getRow(db, media, id);
  if (row) {
    await getEnv().MEDIA_CONTROL.delete(row.r2Key);
    await deleteRow(db, media, id);
    await writeAudit(db, {
      actor: "admin",
      action: "catalog.media.delete",
      entityType: "media",
      entityId: id,
    });
  }
  return seeOther(`${back}?mediaDeleted=1`);
}
