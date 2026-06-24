import { garmentType, saveRow, writeAudit } from "@cutura/db";

import { controlDb } from "@/server/catalog";
import { localizedFromForm, seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const key = String(form.get("key") ?? "").trim();
  const nameI18n = localizedFromForm(form, "name");
  if (!key || !nameI18n.de) return seeOther("/garment-types?error=required");

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const db = controlDb();
  await saveRow(db, garmentType, { id, key, nameI18n, createdAt: now, updatedAt: now });
  await writeAudit(db, {
    actor: "admin",
    action: "catalog.garmentType.create",
    entityType: "garmentType",
    entityId: id,
  });
  return seeOther("/garment-types?created=1");
}
