# CUTURA

Swiss made-to-measure clothing platform. A customer configures a garment, gives
body measurements, and pays; the garment is produced on demand in Vietnam,
quality-checked in Switzerland, and shipped.

This README is the founder-facing operating manual. The engineering specs live in
`docs/REQUIREMENTS.md` (what to build), `docs/PLAN.md` (how), `CLAUDE.md` (agent
operating manual), and `docs/CONVENTIONS.md` (living conventions).

## Architecture in plain terms

Everything runs on **Cloudflare**: one customer **storefront** and one **admin**
control plane (both Next.js on Cloudflare Workers via OpenNext), a **D1** database
per environment, **KV** for sessions and rate limiting, **R2** for images.
**Shopify** is used only to take payment. There are two isolated environments,
**Staging** and **Production**, plus a **control** database where the catalog is
authored and then published into an environment.

```
apps/storefront   customer site (Staging + Production)
apps/admin        catalog editor, publishing, operations (one deployment)
packages/core     pure domain logic (pricing, measurements, status, QC, snapshot)
packages/db       Drizzle schema, migrations, publish routine
packages/config   shared tsconfig, eslint, prettier, env
infra/            setup runbook and generated migrations
```

## First-time setup

See `infra/setup-runbook.md`. It creates the Cloudflare resources, sets secrets,
and configures the GitHub deploy gate. This is the only thing blocking the live
staging deploy.

## Releasing code

1. Changes land on a branch and merge to `main` (the quality gate must pass).
2. On merge, CI deploys both apps to **Staging** and runs the live smoke test.
3. Verify on the staging url.
4. Run the **Release to Production** workflow (Actions tab -> Release to
   Production -> Run). It waits for your approval, deploys, migrates, runs the
   production smoke test, and tags the release.

## Publishing catalog

Built in milestone M2: author an item in the admin as a draft, publish to
Staging, verify, then publish to Production. (The admin UI is not built yet.)

## Rolling back code

```bash
pnpm --filter @cutura/storefront exec wrangler rollback --env production
```

Caveats: a rollback does **not** revert the database, KV, or R2, and uses current
secret values. Because migrations are backwards-compatible, a code rollback is
safe with the existing schema.

## Restoring data

D1 keeps point-in-time history for 30 days:

```bash
pnpm --filter @cutura/storefront exec wrangler d1 time-travel restore cutura-production --timestamp <ISO>
pnpm --filter @cutura/storefront exec wrangler d1 export cutura-production --remote --output backup.sql
```

## Pausing orders

Built in milestone M5 (capacity cap and vacation mode with a calm message).

## Reading CI

Each push runs the quality gate and (on main) deploys to Staging with the smoke
test. A red gate blocks the deploy. Check the Actions tab; `gh run watch` follows
a run from the terminal.
