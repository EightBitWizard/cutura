import { defineConfig } from "drizzle-kit";

// Drizzle Kit config. Used to GENERATE SQL migrations (drizzle-kit generate);
// migrations are APPLIED by `wrangler d1 migrations apply` in CI, not by
// drizzle-kit, so no D1 credentials are needed here. D1 is SQLite, so the
// dialect is "sqlite". Output goes to infra/migrations (PLAN.md section 4),
// where each app's wrangler.jsonc points its migrations_dir/migrations_pattern.
export default defineConfig({
  schema: "./src/schema",
  out: "../../infra/migrations",
  dialect: "sqlite",
});
