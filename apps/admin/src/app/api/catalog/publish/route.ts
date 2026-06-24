import { publishEntity } from "@cutura/db";

import { controlDb, environmentDb, parseEnvironment } from "@/server/catalog";
import { getEnv } from "@/server/env";
import { safePath, seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const entityType = String(form.get("entityType") ?? "");
  const entityId = String(form.get("entityId") ?? "");
  const environment = parseEnvironment(form.get("environment"));
  const back = safePath(form.get("back"));
  if (!entityType || !entityId) return seeOther(`${back}?error=publish`);

  const env = getEnv();
  const targetBucket = environment === "production" ? env.MEDIA_PRODUCTION : env.MEDIA_STAGING;
  await publishEntity(entityType, entityId, {
    control: controlDb(),
    target: environmentDb(environment),
    environment,
    publishedBy: "admin",
    // Copy published media objects from the control bucket into the target bucket
    // (small adapters over R2 so the publish routine stays R2-type-free).
    media: {
      source: {
        async get(key) {
          const object = await env.MEDIA_CONTROL.get(key);
          return object
            ? { body: object.body, httpMetadata: { contentType: object.httpMetadata?.contentType } }
            : null;
        },
      },
      target: {
        head: (key) => targetBucket.head(key),
        put: (key, value, options) =>
          targetBucket.put(key, value as Parameters<typeof targetBucket.put>[1], {
            httpMetadata: options?.httpMetadata,
          }),
      },
    },
  });
  return seeOther(`${back}?published=${environment}`);
}
