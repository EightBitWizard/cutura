import { attributeDefinition, saveRow, writeAudit } from "@cutura/db";

import { controlDb } from "@/server/catalog";
import { localizedFromForm, seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const key = String(form.get("key") ?? "").trim();
  const labelI18n = localizedFromForm(form, "label");
  const appliesTo = form.get("appliesTo") === "fabric" ? "fabric" : "model";
  if (!key || !labelI18n.de) return seeOther("/attributes?error=required");

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const db = controlDb();
  await saveRow(db, attributeDefinition, {
    id,
    key,
    labelI18n,
    appliesTo,
    createdAt: now,
    updatedAt: now,
  });
  await writeAudit(db, {
    actor: "admin",
    action: "catalog.attributeDefinition.create",
    entityType: "attributeDefinition",
    entityId: id,
  });
  return seeOther("/attributes?created=1");
}
