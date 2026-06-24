import { removeEntityAttributeValue, setEntityAttributeValue } from "@cutura/db";

import { controlDb } from "@/server/catalog";
import { safePath, seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

// Assign (or clear) a model/fabric attribute value (FR-2C0). Writes to control;
// the value is carried to the env DB when the model/fabric is published.
export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const back = safePath(form.get("back"));
  const attributeDefinitionId = String(form.get("attributeDefinitionId") ?? "").trim();
  const entityType = form.get("entityType") === "fabric" ? "fabric" : "model";
  const entityId = String(form.get("entityId") ?? "").trim();
  const value = String(form.get("value") ?? "").trim();
  if (!attributeDefinitionId || !entityId) return seeOther(`${back}?error=attr`);

  const db = controlDb();
  if (value) {
    await setEntityAttributeValue(db, attributeDefinitionId, entityType, entityId, value);
  } else {
    await removeEntityAttributeValue(db, attributeDefinitionId, entityType, entityId);
  }
  return seeOther(`${back}?attr=1`);
}
