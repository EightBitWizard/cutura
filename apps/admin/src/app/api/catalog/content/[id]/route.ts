import { contentPage, getRow, saveRow, writeAudit } from "@cutura/db";

import { controlDb } from "@/server/catalog";
import { localizedFromForm, seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const form = await request.formData();
  const db = controlDb();
  const existing = await getRow(db, contentPage, id);
  if (!existing) return seeOther("/content?error=notfound");

  const titleI18n = localizedFromForm(form, "title");
  if (!titleI18n.de) return seeOther(`/content/${id}?error=required`);

  await saveRow(db, contentPage, {
    ...existing,
    kind: form.get("kind") === "legal" ? "legal" : "content",
    titleI18n,
    bodyI18n: localizedFromForm(form, "body"),
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  });
  await writeAudit(db, {
    actor: "admin",
    action: "catalog.content.update",
    entityType: "contentPage",
    entityId: id,
  });
  return seeOther(`/content/${id}?saved=1`);
}
