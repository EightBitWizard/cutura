# Architecture

Cloudflare-only. Two Next.js apps on Workers (OpenNext), D1 per environment, KV,
R2. Shopify is the payment rail only. See `CLAUDE.md` for the full invariants and
`docs/CONVENTIONS.md` for volatile specifics.

## Units

- `apps/storefront` - customer site, deployed to Staging and Production.
- `apps/admin` - catalog control plane and operations, one deployment, bound to
  the control, staging, and production databases so it can publish into each.
- `packages/core` - pure domain logic (no framework or Cloudflare imports):
  pricing, money/VAT, the measurement estimator seam, three-layer profile and
  versioning, the immutable snapshot builder, the status machine, outliers, QC.
- `packages/db` - Drizzle schema, migrations, the per-request client, and the
  catalog publish routine (the only writer of published catalog into environments).
- `packages/config` - shared tsconfig, eslint, prettier, typed env.

## Environments and databases

Three D1 databases: **control** (canonical catalog + drafts), **staging**,
**production**. The storefront worker binds the staging or production database
per deployment (`--env`); the admin worker binds all three. An item published
only to Staging cannot reach Production because Production is a different database.

## Order data flow

1. The storefront computes a server-authoritative price for a configuration.
2. At checkout the backend creates a Shopify Draft Order with the price as an
   override and the configuration/measurement reference as properties; the
   customer pays on Shopify's hosted checkout (VAT recorded tax inclusive).
3. The `orders/paid` webhook (HMAC-verified, idempotent on the event id) creates
   one immutable production package per garment.
4. The order waits for founder approval. Dispatch depends on the supplier's order
   channel (supplier.capabilities): classic suppliers get the spec email + PDF;
   producer-adapter suppliers (Kutetailor) get no email - the admin order page
   renders an English order sheet (codes via producer_catalog_map, body
   measurements in cm) that the founder enters in the producer portal, with a
   prepared API mode activated later by a data switch.
5. The guarded status machine drives the lifecycle; QC in Switzerland records a
   checklist; a fail cannot pass without an audited override; multi-item orders
   ship together once all items pass.

Steps 2 to 5 are built in later milestones (M3+). The domain logic and schema for
them exist now in `packages/core` and `packages/db`.
