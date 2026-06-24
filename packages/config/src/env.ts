import { z } from "zod";

/**
 * Typed environment for CUTURA workers. Cloudflare bindings (D1, KV, R2, IMAGES)
 * are objects supplied by the runtime and are typed via cloudflare-env.d.ts; this
 * module validates the plain string vars and secrets at the boundary with zod.
 */

export const cuturaEnvSchema = z.enum(["development", "staging", "production", "admin"]);
export type CuturaEnv = z.infer<typeof cuturaEnvSchema>;

/** Non-secret runtime vars set in wrangler.jsonc [vars]. */
export const varsSchema = z.object({
  CUTURA_ENV: cuturaEnvSchema,
});
export type Vars = z.infer<typeof varsSchema>;

export function parseVars(input: unknown): Vars {
  return varsSchema.parse(input);
}

/**
 * Secret names expected per worker (documented in .dev.vars.example, set via
 * `wrangler secret put`). Listed here so a future env validator can assert their
 * presence at startup. The Shopify secrets back the payment rail (M3); the store
 * domain + API version are non-secret [vars].
 */
export const SECRET_NAMES = [
  "SESSION_SECRET",
  "MEASUREMENT_ENCRYPTION_KEY",
  "EMAIL_PROVIDER_KEY",
  "ADMIN_AUTH_SECRET",
  "SHOPIFY_ADMIN_API_TOKEN",
  "SHOPIFY_WEBHOOK_SECRET",
] as const;
export type SecretName = (typeof SECRET_NAMES)[number];
