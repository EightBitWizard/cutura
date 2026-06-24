import { setPrimaryMedia, writeAudit } from "@cutura/db";

import { controlDb } from "@/server/catalog";
import { safePath, seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const form = await request.formData();
  const entityType = String(form.get("entityType") ?? "").trim();
  const entityId = String(form.get("entityId") ?? "").trim();
  const back = safePath(form.get("back"));
  if (entityType && entityId) {
    const db = controlDb();
    await setPrimaryMedia(db, entityType, entityId, id);
    await writeAudit(db, {
      actor: "admin",
      action: "catalog.media.setPrimary",
      entityType: "media",
      entityId: id,
    });
  }
  return seeOther(`${back}?primary=1`);
}
