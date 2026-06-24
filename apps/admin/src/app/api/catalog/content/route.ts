import { contentPage, saveRow, writeAudit } from "@cutura/db";

import { controlDb } from "@/server/catalog";
import { localizedFromForm, seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const slug = String(form.get("slug") ?? "").trim();
  const kind = form.get("kind") === "legal" ? "legal" : "content";
  const titleI18n = localizedFromForm(form, "title");
  if (!slug || !titleI18n.de) return seeOther("/content?error=required");

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const db = controlDb();
  await saveRow(db, contentPage, {
    id,
    slug,
    kind,
    titleI18n,
    bodyI18n: localizedFromForm(form, "body"),
    version: 1,
    createdAt: now,
    updatedAt: now,
  });
  await writeAudit(db, {
    actor: "admin",
    action: "catalog.content.create",
    entityType: "contentPage",
    entityId: id,
  });
  return seeOther(`/content/${id}`);
}
