import { defineConfig } from "vitest/config";

// The migration validity test applies the generated SQL into Node's built-in
// SQLite (D1 is SQLite), so the worker processes need the experimental flag.
// Integration tests against real D1/KV bindings run on the Workers pool once the
// apps and their wrangler configs exist.
export default defineConfig({
  test: {
    environment: "node",
    // Node-pool tests only (migration + seed validity via node:sqlite). The
    // publish routine's D1-batch behavior is tested on the Workers pool in
    // vitest.workers.config.ts.
    include: ["src/**/*.node.test.ts"],
    pool: "forks",
    poolOptions: {
      forks: { execArgv: ["--experimental-sqlite"] },
    },
  },
});
