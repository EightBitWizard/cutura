import { deleteRow, supplier, writeAudit } from "@cutura/db";

import { controlDb } from "@/server/catalog";
import { seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const db = controlDb();
  await deleteRow(db, supplier, id);
  await writeAudit(db, {
    actor: "admin",
    action: "supplier.delete",
    entityType: "supplier",
    entityId: id,
  });
  return seeOther("/suppliers?deleted=1");
}
