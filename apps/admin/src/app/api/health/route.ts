import { getCloudflareContext } from "@opennextjs/cloudflare";

// Liveness + readiness for the admin deploy smoke test: reads the control DB
// binding and the environment var. Dynamic so it is never statically evaluated.
export const dynamic = "force-dynamic";

interface HealthEnv {
  CONTROL_DB: { prepare(query: string): { first(): Promise<unknown> } };
  CUTURA_ENV?: string;
}

export async function GET() {
  const { env } = getCloudflareContext() as unknown as { env: HealthEnv };

  let db: "ok" | "down" = "down";
  try {
    await env.CONTROL_DB.prepare("SELECT 1").first();
    db = "ok";
  } catch {
    db = "down";
  }

  return Response.json({
    status: db === "ok" ? "ok" : "degraded",
    environment: env.CUTURA_ENV ?? "unknown",
    db,
    time: new Date().toISOString(),
  });
}
