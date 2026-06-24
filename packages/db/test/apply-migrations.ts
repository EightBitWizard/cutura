import { applyD1Migrations, env } from "cloudflare:test";

// Setup files run outside per-test storage isolation and may run more than once.
// applyD1Migrations only applies un-applied migrations, so this is idempotent.
// Apply to both the control and target test databases.
await applyD1Migrations(env.CONTROL_TEST_DB, env.TEST_MIGRATIONS);
await applyD1Migrations(env.TARGET_TEST_DB, env.TEST_MIGRATIONS);
await applyD1Migrations(env.PROD_TEST_DB, env.TEST_MIGRATIONS);
