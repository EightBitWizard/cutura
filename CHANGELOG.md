# Changelog

All notable changes to this project. Newest first.

## Unreleased

### Added (M0 foundation + M1 start)

- pnpm + Turborepo monorepo with shared config (`packages/config`): tsconfig
  base, flat ESLint preset with the `packages/core` purity boundary, Prettier,
  typed env, and the `check:dashes` (em-dash ban) and `check:copy` quality gates.
- `packages/core`: pure domain logic with 57 unit tests - measurement
  estimators, outlier checks, the status machine with the QC no-silent-pass
  guard, QC templates, server-authoritative pricing, money/VAT helpers, the
  swappable measurement estimator seam, three-layer profile versioning, and the
  immutable order snapshot builder.
- `packages/db`: full Drizzle schema (41 tables: owned catalog, operational,
  config), the first D1 migration, the per-request `getDb` client, the publish
  seam, and a migration validity regression test.
- `apps/storefront` and `apps/admin`: Next.js App Router on Cloudflare Workers
  via OpenNext, with locale-prefixed routing, `/api/health`, and the live-url
  `@smoke` test.
- CI/CD: quality gate, architecture guards, gitleaks, automatic staging deploy,
  and the manual gated production release - both with the live-url smoke test.
- Documentation: CONVENTIONS, ARCHITECTURE, TESTING, SECURITY, PRIVACY, RELEASE,
  the founder README, the setup runbook, and ADR 0001.
