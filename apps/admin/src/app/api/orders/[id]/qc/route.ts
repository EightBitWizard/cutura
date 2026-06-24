import { type QcChecklistItem, getDefaultQcChecklist } from "@cutura/core";
import { submitQc } from "@cutura/db";

import { environmentDb } from "@/server/catalog";
import { seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const form = await request.formData();
  const packageId = String(form.get("packageId") ?? "");
  if (!packageId) return seeOther(`/orders/${id}`);

  const garmentType = form.get("garmentType") === "trouser" ? "trouser" : "shirt";
  const checklist: QcChecklistItem[] = getDefaultQcChecklist(garmentType).map((t) => ({
    id: t.id,
    label: t.label,
    result: form.get(`result_${t.id}`) === "fail" ? "fail" : "ok",
  }));
  const notes = String(form.get("notes") ?? "").trim() || undefined;

  await submitQc(environmentDb("staging"), {
    productionPackageId: packageId,
    checklist,
    notes,
    reviewedBy: "admin",
  });
  return seeOther(`/orders/${id}?qc=1`);
}
