import { deleteCollection, writeAudit } from "@cutura/db";

import { controlDb } from "@/server/catalog";
import { seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const db = controlDb();
  await deleteCollection(db, id);
  await writeAudit(db, {
    actor: "admin",
    action: "catalog.collection.delete",
    entityType: "collection",
    entityId: id,
  });
  return seeOther("/collections?deleted=1");
}
