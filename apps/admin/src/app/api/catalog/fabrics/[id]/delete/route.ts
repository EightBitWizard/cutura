import { deleteRow, fabric, writeAudit } from "@cutura/db";

import { controlDb } from "@/server/catalog";
import { seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const db = controlDb();
  await deleteRow(db, fabric, id);
  await writeAudit(db, {
    actor: "admin",
    action: "catalog.fabric.delete",
    entityType: "fabric",
    entityId: id,
  });
  return seeOther("/fabrics?deleted=1");
}
