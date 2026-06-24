# Changelog

All notable changes to this project. Newest first.

## Unreleased

### Added (M2 - catalog platform and admin control plane)

- Admin authentication (password and a signed KV session, separate from
  customers), an audit trail, and Web-Crypto session primitives in `packages/core`.
- The catalog publish-to-environment routine (dependency-closure resolvers,
  idempotent, one atomic D1 batch, environment-isolated; publish and unpublish),
  with a real-D1 Workers Vitest pool.
- Catalog data-layer helpers and a no-code admin for all eight entity types
  (garment types; base models with pricing and allow-lists; fabrics; option
  groups and values; upgrades; collections and members; attributes; supplier),
  each with localized content, incomplete-locale surfacing, and publish/unpublish.
- R2 image upload with a primary flag and ordering, and an authenticated preview.
- The storefront published-catalog read API (localized, allow-lists resolved).
- Security: fixed an open redirect in the publish/unpublish handlers (safePath).

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
