import { collection, saveRow, writeAudit } from "@cutura/db";

import { controlDb } from "@/server/catalog";
import { localizedFromForm, seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const handle = String(form.get("handle") ?? "").trim();
  const nameI18n = localizedFromForm(form, "name");
  if (!handle || !nameI18n.de) return seeOther("/collections?error=required");

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const db = controlDb();
  await saveRow(db, collection, {
    id,
    handle,
    nameI18n,
    descriptionI18n: localizedFromForm(form, "description"),
    createdAt: now,
    updatedAt: now,
  });
  await writeAudit(db, {
    actor: "admin",
    action: "catalog.collection.create",
    entityType: "collection",
    entityId: id,
  });
  return seeOther(`/collections/${id}`);
}
