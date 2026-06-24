import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// M0: server-rendered, no ISR, so no incremental-cache bindings are needed.
// When ISR/revalidation is later adopted, add the R2 incremental cache and the
// reserved cache bindings (recorded in docs/CONVENTIONS.md).
export default defineCloudflareConfig({});
