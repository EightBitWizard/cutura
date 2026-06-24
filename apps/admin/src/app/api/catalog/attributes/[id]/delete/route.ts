import { attributeDefinition, deleteRow, writeAudit } from "@cutura/db";

import { controlDb } from "@/server/catalog";
import { seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const db = controlDb();
  await deleteRow(db, attributeDefinition, id);
  await writeAudit(db, {
    actor: "admin",
    action: "catalog.attributeDefinition.delete",
    entityType: "attributeDefinition",
    entityId: id,
  });
  return seeOther("/attributes?deleted=1");
}
