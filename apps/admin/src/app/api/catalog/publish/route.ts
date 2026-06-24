import { publishEntity } from "@cutura/db";

import { controlDb, environmentDb, parseEnvironment } from "@/server/catalog";
import { seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const entityType = String(form.get("entityType") ?? "");
  const entityId = String(form.get("entityId") ?? "");
  const environment = parseEnvironment(form.get("environment"));
  const back = String(form.get("back") ?? "/");
  if (!entityType || !entityId) return seeOther(`${back}?error=publish`);

  await publishEntity(entityType, entityId, {
    control: controlDb(),
    target: environmentDb(environment),
    environment,
    publishedBy: "admin",
  });
  return seeOther(`${back}?published=${environment}`);
}
