import { deleteRow, listMedia, media, writeAudit } from "@cutura/db";

import { environmentDb, parseEnvironment } from "@/server/catalog";
import { getEnv } from "@/server/env";
import { safePath, seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

const SLOTS = new Set(["hero", "fabric", "workshop"]);

// Remove the landing image for a slot in the chosen environment (row + R2 object).
export async function POST(request: Request): Promise<Response> {
  const env = getEnv();
  const form = await request.formData();
  const slot = String(form.get("slot") ?? "").trim();
  const environment = parseEnvironment(form.get("environment"));
  const back = safePath(form.get("back"), "/landing");
  if (!SLOTS.has(slot)) return seeOther(`${back}?env=${environment}&error=slot`);

  const db = environmentDb(environment);
  const bucket = environment === "production" ? env.MEDIA_PRODUCTION : env.MEDIA_STAGING;
  for (const row of await listMedia(db, "landing", slot)) {
    await bucket.delete(row.r2Key);
    await deleteRow(db, media, row.id);
    await writeAudit(db, {
      actor: "admin",
      action: "landing.media.delete",
      entityType: "media",
      entityId: row.id,
    });
  }
  return seeOther(`${back}?env=${environment}&removed=1`);
}
