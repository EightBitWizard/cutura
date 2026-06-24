import { optionValue, saveRow, writeAudit } from "@cutura/db";

import { controlDb } from "@/server/catalog";
import { localizedFromForm, seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const form = await request.formData();
  const code = String(form.get("code") ?? "").trim();
  const labelI18n = localizedFromForm(form, "label");
  if (!code || !labelI18n.de) return seeOther(`/option-groups/${id}?error=required`);

  const now = new Date().toISOString();
  const valueId = crypto.randomUUID();
  const db = controlDb();
  await saveRow(db, optionValue, {
    id: valueId,
    optionGroupId: id,
    code,
    labelI18n,
    surchargeMinor: Number(form.get("surchargeMinor") ?? 0) || 0,
    createdAt: now,
    updatedAt: now,
  });
  await writeAudit(db, {
    actor: "admin",
    action: "catalog.optionValue.create",
    entityType: "optionValue",
    entityId: valueId,
  });
  return seeOther(`/option-groups/${id}`);
}
