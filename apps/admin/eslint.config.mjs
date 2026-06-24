import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

import base from "@cutura/config/eslint";

const config = [
  { ignores: [".next/**", ".open-next/**", ".wrangler/**"] },
  ...base,
  ...nextVitals,
  ...nextTs,
];

export default config;
