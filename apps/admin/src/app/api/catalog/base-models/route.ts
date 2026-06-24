import { baseModel, saveRow, writeAudit } from "@cutura/db";

import { controlDb } from "@/server/catalog";
import { localizedFromForm, seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

function parseStatus(value: FormDataEntryValue | null): "draft" | "view_only" | "orderable" {
  return value === "orderable" ? "orderable" : value === "view_only" ? "view_only" : "draft";
}

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const garmentTypeId = String(form.get("garmentTypeId") ?? "").trim();
  const handle = String(form.get("handle") ?? "").trim();
  const nameI18n = localizedFromForm(form, "name");
  if (!garmentTypeId || !handle || !nameI18n.de) return seeOther("/base-models?error=required");

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const db = controlDb();
  await saveRow(db, baseModel, {
    id,
    garmentTypeId,
    handle,
    nameI18n,
    descriptionI18n: localizedFromForm(form, "description"),
    basePriceMinor: Number(form.get("basePriceMinor") ?? 0) || 0,
    leadTimeMinDays: Number(form.get("leadTimeMinDays") ?? 21) || 21,
    leadTimeMaxDays: Number(form.get("leadTimeMaxDays") ?? 35) || 35,
    status: parseStatus(form.get("status")),
    createdAt: now,
    updatedAt: now,
  });
  await writeAudit(db, {
    actor: "admin",
    action: "catalog.baseModel.create",
    entityType: "baseModel",
    entityId: id,
  });
  return seeOther(`/base-models/${id}`);
}
