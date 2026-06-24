import type { D1Database } from "@cloudflare/workers-types";

declare module "cloudflare:test" {
  interface ProvidedEnv {
    CONTROL_TEST_DB: D1Database;
    TARGET_TEST_DB: D1Database;
    PROD_TEST_DB: D1Database;
    TEST_MIGRATIONS: import("cloudflare:test").D1Migration[];
  }
}
