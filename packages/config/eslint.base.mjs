// Shared flat ESLint config for the CUTURA monorepo.
//   import base, { corePurity } from "@cutura/config/eslint";
// Apps spread `base` and add the Next presets; packages/core adds `corePurity`.

import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export const ignores = {
  ignores: [
    "**/node_modules/**",
    "**/.next/**",
    "**/.open-next/**",
    "**/.wrangler/**",
    "**/.turbo/**",
    "**/dist/**",
    "**/coverage/**",
    "**/playwright-report/**",
    "**/test-results/**",
    "**/*.d.ts",
  ],
};

/** Base config: ESLint + typescript-eslint recommended, Node globals, strict unused-vars. */
export const base = [
  ignores,
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];

/**
 * Architecture invariant: packages/core stays pure TypeScript with no framework
 * or Cloudflare imports. Apply this block in packages/core/eslint.config.mjs.
 */
export const corePurity = {
  files: ["**/*.ts"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        paths: [
          { name: "react", message: "packages/core must stay framework-free." },
          { name: "react-dom", message: "packages/core must stay framework-free." },
          { name: "next", message: "packages/core must stay framework-free." },
        ],
        patterns: [
          {
            group: ["next/*", "@opennextjs/*", "cloudflare:*", "@cloudflare/*", "drizzle-orm/d1"],
            message: "packages/core must stay framework-free and Cloudflare-free.",
          },
        ],
      },
    ],
  },
};

export default base;
