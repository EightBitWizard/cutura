import { defineConfig } from "vitest/config";

// Node-pool unit tests for pure storefront server logic (auth, magic-link, session)
// that take injected dependencies (a KV-like store, secrets) and need no Workers
// runtime. Route handlers and pages are covered by build + e2e, not here.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
