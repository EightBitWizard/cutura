import { getCloudflareContext } from "@opennextjs/cloudflare";

// Liveness + readiness for the deploy smoke test. It reads the environment var
// and runs a trivial D1 query so the smoke can assert the worker booted, the DB
// binding works, and the deploy hit the intended environment - the check that
// would have caught the previous build's silent prod-down. Dynamic so it is
// never statically evaluated at build time.
export const dynamic = "force-dynamic";

interface HealthEnv {
  DB: { prepare(query: string): { first(): Promise<unknown> } };
  CUTURA_ENV?: string;
}

export async function GET() {
  const { env } = getCloudflareContext() as unknown as { env: HealthEnv };

  let db: "ok" | "down" = "down";
  try {
    await env.DB.prepare("SELECT 1").first();
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
