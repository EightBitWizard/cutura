import { fabric, saveRow, writeAudit } from "@cutura/db";

import { controlDb } from "@/server/catalog";
import { localizedFromForm, seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const code = String(form.get("code") ?? "").trim();
  const nameI18n = localizedFromForm(form, "name");
  if (!code || !nameI18n.de) return seeOther("/fabrics?error=required");

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const db = controlDb();
  await saveRow(db, fabric, {
    id,
    code,
    nameI18n,
    surchargeMinor: Number(form.get("surchargeMinor") ?? 0) || 0,
    available: form.get("available") === "on",
    createdAt: now,
    updatedAt: now,
  });
  await writeAudit(db, {
    actor: "admin",
    action: "catalog.fabric.create",
    entityType: "fabric",
    entityId: id,
  });
  return seeOther("/fabrics?created=1");
}
