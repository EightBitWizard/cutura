import { deleteProducerMapping, upsertProducerMapping } from "@cutura/db";

import { environmentDb } from "@/server/catalog";
import { seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

const ENTITY_TYPES = new Set(["model", "fabric", "option_value", "upgrade"]);

// Producer catalog mapping CRUD (CUTURA code -> producer external code).
export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const db = environmentDb("staging");
  const producer = String(form.get("producer") ?? "").trim();
  const back = `/suppliers/mappings?producer=${encodeURIComponent(producer || "kutetailor")}`;

  if (form.get("_action") === "delete") {
    const id = String(form.get("id") ?? "");
    if (id) await deleteProducerMapping(db, id, "admin");
    return seeOther(back);
  }

  const entityType = String(form.get("entityType") ?? "");
  const entityKey = String(form.get("entityKey") ?? "").trim();
  const externalCode = String(form.get("externalCode") ?? "").trim();
  if (!producer || !ENTITY_TYPES.has(entityType) || !entityKey || !externalCode) {
    return seeOther(`${back}&error=required`);
  }
  await upsertProducerMapping(
    db,
    {
      producer,
      entityType: entityType as "model" | "fabric" | "option_value" | "upgrade",
      entityKey,
      externalCode,
    },
    "admin",
  );
  return seeOther(`${back}&saved=1`);
}
