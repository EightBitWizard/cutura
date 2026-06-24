import { optionGroup, saveRow, writeAudit } from "@cutura/db";

import { controlDb } from "@/server/catalog";
import { localizedFromForm, seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const garmentTypeId = String(form.get("garmentTypeId") ?? "").trim();
  const code = String(form.get("code") ?? "").trim();
  const labelI18n = localizedFromForm(form, "label");
  if (!garmentTypeId || !code || !labelI18n.de) return seeOther("/option-groups?error=required");

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const db = controlDb();
  await saveRow(db, optionGroup, {
    id,
    garmentTypeId,
    code,
    labelI18n,
    createdAt: now,
    updatedAt: now,
  });
  await writeAudit(db, {
    actor: "admin",
    action: "catalog.optionGroup.create",
    entityType: "optionGroup",
    entityId: id,
  });
  return seeOther(`/option-groups/${id}`);
}
