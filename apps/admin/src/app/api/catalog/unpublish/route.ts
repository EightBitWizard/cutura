import { unpublishEntity } from "@cutura/db";

import { environmentDb, parseEnvironment } from "@/server/catalog";
import { seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const entityType = String(form.get("entityType") ?? "");
  const entityId = String(form.get("entityId") ?? "");
  const environment = parseEnvironment(form.get("environment"));
  const back = String(form.get("back") ?? "/");
  if (!entityType || !entityId) return seeOther(`${back}?error=unpublish`);

  await unpublishEntity(entityType, entityId, {
    target: environmentDb(environment),
    environment,
    publishedBy: "admin",
  });
  return seeOther(`${back}?unpublished=${environment}`);
}
