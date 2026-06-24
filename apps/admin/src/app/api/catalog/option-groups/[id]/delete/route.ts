import { deleteOptionGroup, writeAudit } from "@cutura/db";

import { controlDb } from "@/server/catalog";
import { seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const db = controlDb();
  await deleteOptionGroup(db, id);
  await writeAudit(db, {
    actor: "admin",
    action: "catalog.optionGroup.delete",
    entityType: "optionGroup",
    entityId: id,
  });
  return seeOther("/option-groups?deleted=1");
}
