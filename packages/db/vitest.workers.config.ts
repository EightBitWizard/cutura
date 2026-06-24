import path from "node:path";

import { defineWorkersProject, readD1Migrations } from "@cloudflare/vitest-pool-workers/config";

// Workers-pool integration tests against REAL D1 (Miniflare), so the publish
// routine exercises actual db.batch semantics. Two D1 bindings model the
// control -> environment copy and prove environment isolation. Drizzle
// migrations from infra/migrations are read at config time and applied to both
// databases in the setup file. Pinned to vitest-pool-workers 0.12 (peer Vitest
// 2-3.2); see docs/CONVENTIONS.md.
export default defineWorkersProject(async () => {
  const migrations = await readD1Migrations(path.join(__dirname, "../../infra/migrations"));
  return {
    test: {
      include: ["src/**/*.workers.test.ts"],
      setupFiles: ["./test/apply-migrations.ts"],
      poolOptions: {
        workers: {
          singleWorker: true,
          miniflare: {
            compatibilityDate: "2026-06-01",
            compatibilityFlags: ["nodejs_compat"],
            // Distinct database ids so the three bindings are isolated databases
            // (a shared ":memory:" id would alias them into one).
            d1Databases: {
              CONTROL_TEST_DB: "control-test",
              TARGET_TEST_DB: "target-test",
              PROD_TEST_DB: "prod-test",
            },
            bindings: { TEST_MIGRATIONS: migrations },
          },
        },
      },
    },
  };
});
