import { collection, getRow, saveRow, setCollectionMembers, writeAudit } from "@cutura/db";

import { controlDb } from "@/server/catalog";
import { localizedFromForm, seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const db = controlDb();
  const existing = await getRow(db, collection, id);
  if (!existing) return seeOther("/collections?error=notfound");

  const form = await request.formData();
  await saveRow(db, collection, {
    ...existing,
    handle: String(form.get("handle") ?? existing.handle).trim() || existing.handle,
    nameI18n: localizedFromForm(form, "name"),
    descriptionI18n: localizedFromForm(form, "description"),
    updatedAt: new Date().toISOString(),
  });
  await setCollectionMembers(db, id, form.getAll("member").map(String));
  await writeAudit(db, {
    actor: "admin",
    action: "catalog.collection.update",
    entityType: "collection",
    entityId: id,
  });
  return seeOther(`/collections/${id}?saved=1`);
}
