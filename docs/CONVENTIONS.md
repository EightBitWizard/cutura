# CUTURA Conventions

Living conventions read before every change. Keep current. `CLAUDE.md` holds the
full architecture invariants and conflict priority; this file holds the volatile
specifics (pinned versions, reserved names, where subsystems live, exact commands).

## Pinned toolchain

| Tool                   | Version       | Notes                                 |
| ---------------------- | ------------- | ------------------------------------- |
| Node                   | 22 (CI), >=20 | local dev may be newer                |
| pnpm                   | 11.9.0        | `packageManager` in root package.json |
| Next.js                | ^16.2         | App Router, Turbopack                 |
| React                  | 19            |                                       |
| @opennextjs/cloudflare | ^1.19         | Workers adapter                       |
| wrangler               | ^4.100        |                                       |
| Drizzle ORM / Kit      | ^0.45 / ^0.31 | D1 (SQLite dialect)                   |
| Vitest                 | ^3            |                                       |
| Tailwind               | v4            | via @tailwindcss/postcss              |

**`compatibility_date` must stay `>= 2025-05-05`** (vars reach `process.env` from
2025-04-01; `FinalizationRegistry` from 2025-05-05). Current pin: `2026-06-01`.
Never lower it.

## Reserved OpenNext cache binding names (do not collide)

Unused in M0 (SSR only, no ISR). When ISR/revalidation is adopted, these are
reserved by `@opennextjs/cloudflare`: `NEXT_INC_CACHE_R2_BUCKET`,
`NEXT_INC_CACHE_KV`, `WORKER_SELF_REFERENCE`, `NEXT_CACHE_DO_QUEUE`,
`NEXT_TAG_CACHE_D1` / `NEXT_TAG_CACHE_DO_SHARDED`, `NEXT_CACHE_DO_PURGE`.

## Where the critical subsystems live

| Subsystem                              | Location                                         |
| -------------------------------------- | ------------------------------------------------ |
| Pricing engine (server-authoritative)  | `packages/core/src/pricing.ts`                   |
| Money and VAT helpers                  | `packages/core/src/money.ts`                     |
| Measurement estimator seam (swappable) | `packages/core/src/estimator.ts`                 |
| Three-layer profile + versioning       | `packages/core/src/profile.ts`                   |
| Immutable order snapshot builder       | `packages/core/src/snapshot.ts`                  |
| Status machine + QC override guard     | `packages/core/src/status.ts`                    |
| Outlier / review gate                  | `packages/core/src/outliers.ts`                  |
| QC checklist templates                 | `packages/core/src/qc.ts`                        |
| DB schema                              | `packages/db/src/schema/*`                       |
| Per-request DB client                  | `packages/db/src/getDb.ts`                       |
| Catalog publish seam                   | `packages/db/src/publish.ts` (impl in M2)        |
| Recommendation seam                    | future (E11); same pattern as the estimator seam |

`packages/core` is pure: no Next, React, or Cloudflare imports (ESLint-enforced).

## Testing approach (hybrid)

- `packages/core`: Vitest on the plain **Node pool** (pure logic, fast).
- `packages/db` and integration: real D1/KV via the **Workers pool**
  (`@cloudflare/vitest-pool-workers`) once apps wire it; the migration validity
  test currently uses Node `node:sqlite` (D1 is SQLite).
- End to end / deploy smoke: Playwright against the **live deployed URL**
  (`apps/storefront/e2e/smoke.spec.ts`, `--grep @smoke`).

This refines the requirements' "Workers pool everywhere" line (that pool cannot
run the Next app). See `docs/DECISIONS/0001-stack-and-conventions.md`.

## D1 / SQLite conventions

Text ids; ISO-8601 text timestamps; integer `0/1` booleans (`mode: "boolean"`);
arrays/objects as JSON text columns validated with zod; money as integer minor
units (Rappen). Migrations are additive and backwards-compatible (expand, then
contract later) because a Workers rollback does not revert D1. Status values are
validated by the core status machine, not a DB enum.

## Commands

```bash
pnpm gate            # lint, typecheck, test, format, dashes, copy, build (the merge gate)
pnpm --filter @cutura/core test
pnpm --filter @cutura/db db:generate     # generate a migration after a schema change
pnpm --filter @cutura/storefront cf:build
BASE_URL=<url> pnpm --filter @cutura/storefront exec playwright test --grep @smoke
```

## Invariants that must never change silently

Server-authoritative pricing; confirmed measurements only change via a new
version; the order snapshot is written once; a QC fail never becomes a pass or
ships without an audited override; orders ingested exactly once (idempotent
webhook); body measurements encrypted at rest; never the em dash U+2014 (gate:
`pnpm check:dashes`).

## Pending follow-ups

- Next 16 deprecates `middleware.ts` in favour of `proxy.ts`; rename when convenient.
- Shopify Admin API version: to be pinned here when the checkout integration lands (M3).
