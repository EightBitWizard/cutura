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

In the admin under **Settings** (`/settings`) you can pause new orders three ways,
all sharing one storefront gate:

- **Manual pause**: tick "Pause new orders now". The storefront immediately blocks
  add-to-cart and checkout and shows your message.
- **Vacation window**: set "Vacation from / until" dates; ordering pauses inside
  the window automatically.
- **Capacity cap**: set a maximum number of open (not-yet-shipped) orders. When
  reached, new orders pause until orders ship. Near the cap, communicated lead
  times extend by the configured buffer.

Set the customer-facing **pause message** per language (a calm default is used if
blank). The gate is enforced on the server, so it holds even if the page is stale.

## Operations console

The admin (`/dashboard`, `/orders/board`, `/fit-reviews`, `/customers`,
`/suppliers`, `/shipping`, `/audit`) runs the operational loop: the pipeline board
with outlier warnings, the fit-review queue, customer management with notes/tags,
supplier + shipping configuration, the KPI dashboard with per-order cost capture,
the audit log, and CSV order export (Dashboard -> Export orders). Set an admin
notification email in Settings to be emailed on each new paid order.

## Shipping configuration

Under **Shipping** (`/shipping`): define zones (e.g. CH, LI) and methods. Standard
shipping is included in the displayed price.

## Content, collections, and discovery

- **Content + legal pages** (`/content`): create and edit About, FAQ, the fit
  guide, and the legal pages in four languages, then publish. They render on the
  storefront at `/<lang>/content/<slug>` and `/<lang>/legal/<slug>`. Final legal
  text needs lawyer sign-off (pending).
- **Collections** (`/collections`): set members, localized name/description, and a
  banner image. Collections and the home page drive browsing.
- **Discovery filters**: assign attributes (colour, occasion, fit, ...) on a base
  model's edit page; they become storefront filters at `/<lang>/discover` and
  occasion pages at `/<lang>/occasions/<value>`.
- **Cross-sell** (`/cross-sell`): curate "you might also like" suggestions.
- **Languages**: the storefront serves German, English, Italian, and French with
  locale-prefixed URLs, browser detection, and a switcher. New visible copy is
  drafted professionally but should be reviewed by a translator before launch.

## Reading CI

Each push runs the quality gate and (on main) deploys to Staging with the smoke
test. A red gate blocks the deploy. Check the Actions tab; `gh run watch` follows
a run from the terminal.
