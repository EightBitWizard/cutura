# Testing

Verification against reality, not self-reported success. CI, not an agent's word,
is the gate.

## Layers

- **Unit (Node pool):** `packages/core` domain logic. Estimators (golden
  fixtures), outliers, the status machine and guards, pricing and VAT math,
  snapshot immutability, profile versioning. Fast, no Cloudflare runtime.
- **Migration / DB:** `packages/db` applies the generated migrations into real
  SQLite (D1 is SQLite) and asserts the schema. Integration tests against real
  D1/KV use the Cloudflare Workers Vitest pool once the apps wire it.
- **End to end / deploy smoke (Playwright):** runs against the **live deployed
  url** (`apps/storefront/e2e/smoke.spec.ts`, `--grep @smoke`), on desktop and
  mobile. It asserts rendered content and a live DB via `/api/health`, not just a
  200, so a half-initialized isolate fails the gate.

Why hybrid rather than the Workers pool everywhere: that pool cannot run the Next
app and a SQLite fake hides real D1 behaviour. See ADR 0001.

## The gate

`pnpm gate` = lint, typecheck, test, format check, dash check, copy check, build.
CI runs it on every PR and on push to `main`; merge and deploy are blocked unless
green. The deploy smoke runs after each deploy against the live url.

## Policy

No new domain logic without tests. No bug fix without a failing regression test
first. Every past failure class is locked by a test (the schema-drift failure is
locked by the migration test; the green-but-down failure by the live-url smoke).
Estimator, pricing, and VAT tests are deterministic with golden fixtures.
