import { saveRow, supplier, writeAudit } from "@cutura/db";

import { controlDb } from "@/server/catalog";
import { seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  if (!name) return seeOther("/suppliers?error=required");

  const notes = String(form.get("notes") ?? "").trim();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const db = controlDb();
  await saveRow(db, supplier, {
    id,
    name,
    contact: null,
    capabilities: null,
    notes: notes || null,
    isDefault: form.get("isDefault") === "on",
    createdAt: now,
    updatedAt: now,
  });
  await writeAudit(db, {
    actor: "admin",
    action: "supplier.create",
    entityType: "supplier",
    entityId: id,
  });
  return seeOther("/suppliers?created=1");
}
