import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

import base from "@cutura/config/eslint";

// Storefront lint: shared base plus the Next presets. The OpenNext adapter
// manages the runtime, so the edge runtime directive must never be used; CI also
// greps for it as a guard.
const config = [
  { ignores: [".next/**", ".open-next/**", ".wrangler/**", "e2e/**"] },
  ...base,
  ...nextVitals,
  ...nextTs,
];

export default config;
