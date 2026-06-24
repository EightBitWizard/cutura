import { deleteBaseModel, writeAudit } from "@cutura/db";

import { controlDb } from "@/server/catalog";
import { seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const db = controlDb();
  await deleteBaseModel(db, id);
  await writeAudit(db, {
    actor: "admin",
    action: "catalog.baseModel.delete",
    entityType: "baseModel",
    entityId: id,
  });
  return seeOther("/base-models?deleted=1");
}
