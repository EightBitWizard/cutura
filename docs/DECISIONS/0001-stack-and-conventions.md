# ADR 0001: Stack, config layout, and testing conventions

- Status: accepted
- Date: 2026-06-24

## Context

The from-scratch rebuild (PLAN.md) locks a Cloudflare-only stack. While
scaffolding M0/M1 a few specifics needed deciding, and two of them refine what
the requirements/plan literally say. Recording them so the choices are traceable.

## Decisions

1. **Wrangler and OpenNext configs live inside each app** (`apps/*/wrangler.jsonc`,
   `apps/*/open-next.config.ts`), not under `infra/wrangler/` as PLAN.md section 4
   sketched. The OpenNext adapter resolves these from the app's own directory
   (build cwd) and `.open-next/` is produced there; centralizing them fights the
   tooling. `infra/` holds the setup runbook and the generated migrations.

2. **Migrations output to `infra/migrations/`** (PLAN.md section 4) via
   `drizzle-kit generate`; each app's `wrangler.jsonc` points its
   `migrations_dir` there. Drizzle emits flat `NNNN_name.sql` files, which
   `wrangler d1 migrations apply` reads natively, so no `migrations_pattern` is
   needed.

3. **Testing is hybrid**, refining the requirements' "Vitest with the Workers
   test pool" (E16 NFR / stack table). The Workers pool cannot run the Next app
   and a SQLite fake hides real D1 behaviour, so: `packages/core` on the plain
   Node pool; `packages/db` and integration code on the Workers pool with real
   D1/KV; end-to-end and the deploy smoke via Playwright against the live URL.

4. **Status values are validated by the core status machine, not a D1 enum**, so
   the single source of truth stays in `packages/core`.

5. **Body measurements are stored encrypted at rest** as `_enc` ciphertext
   columns; encryption happens in the app layer (the order snapshot is stored as
   one encrypted blob).

## Consequences

The repo layout differs slightly from PLAN.md section 4 (configs per app;
migrations in `infra/`); CLAUDE.md and CONVENTIONS.md reflect the actual layout.
The hybrid testing choice is documented in CONVENTIONS.md. These do not change
any product behaviour or architecture invariant.
