import { defineConfig } from "vitest/config";

// packages/core is pure TypeScript with no Cloudflare runtime needs, so it runs
// on the plain Node pool (fast). Integration code that touches D1/KV uses the
// Workers pool in packages/db and the apps instead.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.ts"],
  },
});
