import { saveRow, upgrade, writeAudit } from "@cutura/db";

import { controlDb } from "@/server/catalog";
import { localizedFromForm, seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const code = String(form.get("code") ?? "").trim();
  const nameI18n = localizedFromForm(form, "name");
  if (!code || !nameI18n.de) return seeOther("/upgrades?error=required");

  const placement = String(form.get("placement") ?? "").trim();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const db = controlDb();
  await saveRow(db, upgrade, {
    id,
    code,
    nameI18n,
    priceMinor: Number(form.get("priceMinor") ?? 0) || 0,
    placement: placement || null,
    createdAt: now,
    updatedAt: now,
  });
  await writeAudit(db, {
    actor: "admin",
    action: "catalog.upgrade.create",
    entityType: "upgrade",
    entityId: id,
  });
  return seeOther("/upgrades?created=1");
}
