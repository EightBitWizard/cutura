import { defineConfig } from "vitest/config";

// The migration validity test applies the generated SQL into Node's built-in
// SQLite (D1 is SQLite), so the worker processes need the experimental flag.
// Integration tests against real D1/KV bindings run on the Workers pool once the
// apps and their wrangler configs exist.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.ts"],
    pool: "forks",
    poolOptions: {
      forks: { execArgv: ["--experimental-sqlite"] },
    },
  },
});
