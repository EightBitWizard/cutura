import { deleteRow, optionValue, writeAudit } from "@cutura/db";

import { controlDb } from "@/server/catalog";
import { seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; valueId: string }> },
): Promise<Response> {
  const { id, valueId } = await params;
  const db = controlDb();
  await deleteRow(db, optionValue, valueId);
  await writeAudit(db, {
    actor: "admin",
    action: "catalog.optionValue.delete",
    entityType: "optionValue",
    entityId: valueId,
  });
  return seeOther(`/option-groups/${id}`);
}
