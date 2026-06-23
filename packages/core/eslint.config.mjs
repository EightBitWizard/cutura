// packages/core stays pure TypeScript: no React, Next, or Cloudflare imports.
// The corePurity block enforces that boundary (see @cutura/config/eslint).
import base, { corePurity } from "@cutura/config/eslint";

export default [...base, corePurity];
