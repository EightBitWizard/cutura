# CUTURA Implementation Plan

**Version:** 1.0
**Date:** 2026-06-22
**Owner:** Malik (Founder)
**Companion document:** `CUTURA_User_Stories_and_Requirements_v1.md` (the requirements). This plan tells the agent how to build what that document specifies. Read the requirements first, then this plan.

---

## 1. Purpose and how to use this document

This plan is written to be handed to a coding agent together with the requirements file. The requirements define what to build (user stories, acceptance criteria, FR and NFR identifiers). This plan defines how: the technical stack, the repository and infrastructure architecture, the data model, the cross-cutting subsystems, the testing and quality harness, the release process, and a sequenced build plan of milestones with acceptance gates.

Rules for the agent:
- The requirements file is the source of truth for behaviour. This plan is the source of truth for structure and process. If the two ever conflict, stop and ask the founder rather than guessing.
- Every milestone has an acceptance gate. A milestone is not done until its gate is met with real evidence (see Section 9, definition of done). Reporting success is not the same as proving it.
- Build in the order given. The plan front-loads a thin vertical slice (one shirt fully orderable end to end) before widening, so value and integration risk are proven early.
- Keep it simple. Prefer the smallest robust solution. Do not add dependencies, abstractions, or services that are not justified by a requirement in this plan.
- Reference identifiers. When implementing, cite the US and FR identifiers a change satisfies in the pull request description, so traceability holds.

---

## 2. Guiding principles

- **Verification against reality.** Tests and checks must prove behaviour against a running build, not assert that code ran. The deploy smoke test is mandatory and gates production.
- **Server authority.** Pricing, measurement estimation and validation, and order state transitions are computed and enforced on the server. The client is never trusted.
- **Isolation by construction.** Staging and Production are fully separate, with separate databases. Test data cannot reach Production because Production is a different database that only ever receives explicitly published or runtime-created production records.
- **Ported, not reinvented.** The tested domain logic (three-layer measurements, status machine, QC gate, immutable snapshots, outlier and review gate, supplier spec, estimators) is carried into `packages/core` and unit-tested there. Do not rewrite this logic from scratch.
- **Reversibility.** Every change is proven on Staging before Production and can be rolled back. Database migrations are backwards-compatible so a code rollback never leaves the schema ahead of the code in a breaking way.
- **Privacy and trust by design.** Body measurements are specially protected: minimized, encrypted at rest, used only for their stated purpose, fully deletable. Visible copy is professional in all four languages.
- **Simplicity over cleverness.** Lightweight and maintainable beats fancy. This is a solo founder operating the business and a single agent developing it.

---

## 3. Locked technical stack

| Concern | Decision |
|---|---|
| Hosting | Cloudflare Workers only (plus Shopify for payment and an email provider) |
| Frontend and server | Next.js (App Router) deployed to Workers via the OpenNext adapter (`@opennextjs/cloudflare`), Node runtime |
| Database | Cloudflare D1 (SQLite), three databases (control, staging, production) |
| ORM and migrations | Drizzle ORM with Drizzle Kit migrations |
| Object storage | Cloudflare R2 for media originals, Cloudflare image optimization for resizing |
| Ephemeral state | Cloudflare KV for sessions and rate limiting |
| Scheduled work | Cloudflare Cron Triggers |
| Auth (customer) | Magic-link passwordless by email; sessions via signed cookies plus KV |
| Auth (admin) | Separate, stronger admin authentication, isolated from customer auth |
| Payments | Shopify custom app, Admin GraphQL API, Draft Orders with price override, Shopify-hosted checkout |
| Email | Provider behind an abstraction; Resend as the default implementation |
| PDF | pdf-lib (Workers compatible) |
| Styling | Tailwind CSS with the CUTURA design language (Inter, neutral palette) |
| Testing | Vitest with the Workers test pool (unit and integration), Playwright (end to end) |
| CI/CD | GitHub Actions, deploy via Wrangler, Staging automatic, Production manual and gated |
| Lint and format | ESLint (Next.js config) and Prettier, TypeScript strict |
| Package manager | pnpm workspaces, Node 20 or later for tooling |
| Observability | Workers Logs and Logpush, error reporting behind an abstraction |

Constraints to respect (verified against current Cloudflare behaviour):
- A single D1 database is capped around 10 GB and uses a single-writer model. Three databases is well within account limits. This is sufficient for the foreseeable business.
- D1 is SQLite: no stored procedures, limited `ALTER TABLE`. Design migrations as additive and backwards-compatible (expand, then later contract).
- D1 Time Travel provides always-on point-in-time recovery to any minute in the last 30 days. Use `wrangler d1 export` for off-platform copies.
- A Workers rollback (`wrangler rollback`) is immediate but does not revert D1 schema, KV, or R2 changes, and is blocked if a Durable Object migration occurred between versions. Therefore migrations stay backwards-compatible and data recovery uses Time Travel.
- The OpenNext adapter reserves specific binding names for its own caching (for example an R2 incremental cache and a tag cache) and uses an internal Durable Object for its cache queue. Account for these reserved names and do not collide with them.

---

## 4. Repository and project structure

A single pnpm monorepo (the fresh repository already created). Three deployable or shared units plus shared config.

```
cutura/
  apps/
    storefront/        Next.js customer storefront (OpenNext -> Worker). Deployed to Staging and Production.
    admin/             Next.js admin and control plane (OpenNext -> Worker). One deployment. Catalog editing, publishing, operations.
  packages/
    core/              Ported domain logic and shared types. No framework or Cloudflare imports. Pure, unit-tested.
                       (measurement model and three layers, status machine, pricing engine, estimator interface and
                        rule-based shirt and trouser modules, validation, snapshot builder, money and VAT helpers,
                        recommendation interface, shared zod schemas and TypeScript types)
    db/                Drizzle schema, migrations, query helpers, and the publish and promotion logic shared by apps.
    config/            Shared lint, tsconfig, tailwind preset, and typed environment and feature-flag definitions.
  infra/
    wrangler/          Wrangler configuration per app and per environment (staging, production).
    migrations/        Generated D1 migration SQL (Drizzle Kit output), applied via CI and Wrangler.
  docs/
    README.md          Founder-facing operating manual and runbooks (maintained, see Section 12).
    CONVENTIONS.md     Living project conventions read by the agent before every change (see Section 9).
    REQUIREMENTS.md    Copy or link of the requirements file.
    PLAN.md            This plan.
  .github/workflows/   CI and release workflows (see Section 10).
```

Principles for the structure:
- `packages/core` must not import Next.js, React, or Cloudflare modules. It is pure TypeScript so it is fast to unit-test and portable. This is where the safety-critical logic lives and is verified.
- `packages/db` owns the schema and the only code that writes catalog rows into environment databases (the publish routine). Apps call into it rather than duplicating queries.
- The storefront contains no admin code. The admin contains the control plane and operations. This keeps the public surface lean and the boundary clear.
- Shared types flow from `packages/core` and `packages/db` so the storefront, admin, and tests use one set of types.

---

## 5. Infrastructure and environment architecture

### 5.1 Environments

Two fully isolated runtime environments, plus one control plane.

- **Production:** the `storefront` Worker bound to the Production D1 database, Production KV, and Production R2. Serves `cutura.ch` and `www.cutura.ch`. Holds real customers, orders, and measurements, and the catalog published to Production.
- **Staging:** the `storefront` Worker bound to the Staging D1 database, Staging KV, and Staging R2. Serves `staging.cutura.ch`. Holds test customers, test orders, and the catalog published to Staging. Can be locked behind a simple access control so only invited testers reach it.
- **Control plane (admin):** the `admin` Worker, serving `admin.cutura.ch`. Bound to the control D1 database (canonical catalog and drafts) and also to the Staging and Production databases (to publish catalog into them and to run operations per environment). Protected by admin authentication.

DNS moves to Cloudflare. Subdomains: `cutura.ch` and `www` (Production), `staging.cutura.ch` (Staging), `admin.cutura.ch` (admin).

### 5.2 Databases (three)

- **Control database:** the single place catalog is authored and edited. Holds every catalog entity in editable form plus drafts and per-environment publish state. Holds no customer or order data.
- **Staging database:** the catalog published to Staging plus all Staging operational data (test customers, measurements, orders, production packages, QC, and so on).
- **Production database:** the catalog published to Production plus all Production operational data (real customer data).

Operational data is created at runtime by each storefront in its own database. It is never copied between environments. Only catalog is published from the control database into an environment database.

### 5.3 The publish and promotion model

There are two distinct release paths. Keep them separate in code and in the founder runbooks.

**Catalog publishing (content, no code deploy).** In the admin, an entity is edited against the control database in a Draft state. Publishing an entity to an environment resolves its dependency graph (a model needs its allowed fabrics, options, upgrades, attributes, media references, localized content, measurement schema, supplier and QC templates) and upserts the published version of all required records into that environment's database, then marks the entity published to that environment. Each storefront reads only its own environment database, so:
- A Draft entity appears on no storefront.
- An entity published only to Staging exists only in the Staging database and can never appear on Production.
- Re-publishing updates the environment copy; the founder edits freely in the control database and publishes when ready.
- Unpublishing removes or hides the entity in the target environment without touching the control database.

Implement the publish routine once in `packages/db`, transactionally per environment (D1 `batch`), idempotently (re-publish is safe), and with an audit record (who published what, to where, when).

**Code releasing (the app itself).** Covered in Section 10.

### 5.4 Bindings and configuration

- Storefront Worker (per environment) binds: its environment D1 database (`DB`), its KV namespace (`SESSIONS`, `RATE_LIMIT` or one namespace with prefixes), its R2 bucket (`MEDIA`), plus the OpenNext reserved cache bindings. Secrets: email provider key, Shopify credentials and webhook secret, the measurement encryption key, session signing secret.
- Admin Worker binds: control D1 (`CONTROL_DB`), Staging D1 (`STAGING_DB`), Production D1 (`PRODUCTION_DB`), control R2 (`MEDIA`) plus Staging and Production R2 for publishing media, KV for admin sessions and rate limiting. Secrets as above plus admin auth secrets.
- Configuration and feature flags: a typed config module in `packages/config`, with per-environment values stored in the environment database or KV (no third-party flag service). Flags include auto-forward of plausible orders, alteration reimbursement, the photo measurement method, and express shipping. Flags are read server-side and can be toggled without a code change.
- Secrets live in Cloudflare Workers secrets and GitHub Actions encrypted secrets. No secret is ever committed to the repository. A `.dev.vars.example` documents the required names.

---

## 6. Data model

This is an entity overview, not final DDL. The agent writes the Drizzle schema and migrations from it. Group the schema by concern. Use these SQLite and D1 conventions throughout:
- Store arrays and nested objects as JSON text columns (D1 has no array type). Validate them with zod on read and write.
- Use integer 0 or 1 for booleans, and ISO 8601 text (or Unix integer) for timestamps, applied consistently.
- Wrap multi-statement writes in D1 `batch` rather than relying on interactive transactions.
- Keep migrations additive and backwards-compatible. Avoid destructive `ALTER TABLE`. To change a column, add the new one, backfill, switch reads, then retire the old one in a later migration.
- The order snapshot is immutable: write it once and never update it. Enforce in code and never expose an update path.

### 6.1 Catalog (authored in the control database, published copies in environment databases)

- **garment_type:** id, key (shirt, trouser), name, references to measurement_schema, supplier_spec_template, qc_template, publish state. Data-driven so new types need no code.
- **base_model:** id, garment_type_id, base price (minor units), lead-time min and max days, status (draft, view-only, orderable), publish state, media references, ordered list of allowed option groups, allowed fabrics, allowed upgrades.
- **fabric:** id, unique code, fibre composition (structured), care data, surcharge, availability flag, supplier reference, media references, filterable attributes (colour family, weight, and so on).
- **option_group** and **option_value:** group label and garment-type scope; value code, surcharge, media reference. Per model, a group is required or optional.
- **upgrade:** id, name, price, optional placement, media reference, description. Assigned per model, multi-select.
- **collection:** id, handle, banner media, ordered members, publish state. **collection_member** join with order.
- **model_allowed_fabric**, **model_allowed_option**, **model_allowed_upgrade:** the per-model allow-lists (no deny rules anywhere).
- **attribute_definition** and **attribute_value:** the structured, filterable attributes for discovery.
- **localized_content:** per-entity, per-locale text (DE, EN, IT, FR) with German fallback. One table keyed by entity type, entity id, field, locale, or per-entity JSON, agent's choice, but consistent.
- **measurement_schema:** per garment type, the fields, units, and plausible ranges (JSON), versioned.
- **supplier_spec_template** and **qc_template:** per garment type, the structure of the supplier specification and the QC checklist.
- **media:** R2 object key, alt text, type, ordering, primary flag, linked entity.
- **publication:** per entity, the publish state and target environments, plus published-at and published-by for audit.

### 6.2 Operational (per environment database, created at runtime)

- **customer:** id, email, locale, created-at, marketing-consent state, deletion state. No password (magic-link). No stored payment data.
- **session:** server session reference (also in KV); signed cookie carries the id.
- **address:** customer addresses, default flag, restricted to Switzerland and Liechtenstein at checkout.
- **measurement_profile:** one per customer (transient for guests, created at order time and discarded unless the guest registers). Holds the body measurements.
- **measurement_version:** every change creates a version. Each version stores the three layers separately: original inputs, derived values, confirmed values, plus the method used and a timestamp. Body-measurement fields are encrypted at rest.
- **order:** id, human-readable order number, customer or guest reference, locale (frozen), currency CHF, totals (all-inclusive), accepted terms and privacy version, created-at, rolled-up status, guest tracking token.
- **order_item:** one row per garment in the order. Links to its production_package.
- **production_package:** the immutable snapshot for one garment: model, fabric code, full configuration, upgrades with placement and price, confirmed measurements (the effective values including per-piece overrides), notes, delivery target, internal notes, supplier reference. Written once, never updated.
- **status_event:** append-only history of status transitions per order item (and per order where relevant), with actor, from, to, timestamp, reason. Drives the audit trail and the board.
- **qc_record:** per garment, checklist outcome, pass or fail, photos (R2), notes, and the override decision if any. A recorded fail can never be silently dropped or flipped to pass without an audited override.
- **fit_review:** a customer fit request from an order: reason, photos, status, the decision (remake, alteration reimbursement later, refund), and a link to any remake order.
- **fit_feedback:** structured post-delivery feedback (detailed, few mandatory fields), linked to the order, feeding the estimator improvement dataset.
- **supplier:** the tailor entity (contact, capabilities, notes). One at launch; the model supports many and routing later.
- **shipping_zone** and **shipping_method:** owned shipping configuration (zones, methods, prices). Standard shipping is included in the all-inclusive price; the model supports a paid express method later.
- **payment_event:** the idempotency record for Shopify webhooks, keyed by the unique event id, so a paid event is processed exactly once.
- **communication_log:** every email sent to a customer, recorded on the order.
- **notify_request:** notify-me requests for view-only items or unavailable fabrics.
- **audit_log:** admin operations, status changes, and sensitive-data access.
- **order_cost:** optional per-order cost fields (fabric, production, inbound, fees) for margin, captured for later viewing.
- **config** and **feature_flag:** per-environment configuration, capacity cap, pause and vacation state and message, and feature flags.

### 6.3 Relationship notes

- An order has many order items; each order item has exactly one immutable production package and a status history; each item has at most one QC record per production attempt and may have a linked remake.
- A remake creates a new order (or order item) whose production package is built from the original snapshot plus the adjustment, linked back to the original via the fit_review.
- Multi-item orders: each item is produced and QC'd independently, the order shows a rolled-up status, and shipping releases only when every item has passed QC. The parcel ships together.
- Catalog published into an environment is read-only there; it is updated only by re-publishing from the control database.

---

## 7. Cross-cutting subsystems and seams

Build these once, in `packages/core` or `packages/db`, and use them everywhere. Several are explicit swappable seams.

### 7.1 Pricing engine (server-authoritative)
A pure function in `core` that takes a configuration (model, fabric, options, upgrades) and the relevant catalog price components and returns an itemized breakdown and a total in minor units. Prices are gross (VAT inclusive) and all-inclusive (standard shipping included). The client never sends a price; the server recomputes at add-to-cart and again at checkout. Unit-test the math exhaustively, including VAT extraction and the all-inclusive total.

### 7.2 Measurement estimator (modular, swappable seam)
A clearly named interface in `core`, for example `MeasurementEstimator`, with a method that takes a core measurement subset plus the garment type and returns the full set of derived values with per-field confidence and any outlier flags. Ship a rule-based default with shirt and trouser modules registered per garment type. The interface is the seam: a future hosted model, a different input method, or a photo or scan adapter implements the same interface and is selected by configuration. Document the seam in `CONVENTIONS.md` so it is obvious where the estimation model lives and how to replace it. Estimation runs server-side. If it fails, the detailed manual entry path still works (graceful degradation).

### 7.3 Three-layer measurement model and snapshot
In `core`: the original, derived, and confirmed layers, versioning, and the snapshot builder that freezes the effective values (profile plus any per-piece override) into the immutable production package at purchase. Confirmed values never change without an explicit, versioned action. Unit-test versioning and the no-silent-change rule.

### 7.4 Status machine
In `core`: the states (new, in_review, approved, in_production, arrived_ch, qc_passed, qc_failed, awaiting_customer_info, shipped, problem), the allowed transitions, and guards (for example shipping requires qc_passed or an audited override only from qc_failed; approval moves in_review to approved and triggers the supplier email). Every transition writes a status_event. Unit-test that disallowed transitions are rejected and that a QC fail cannot become qc_passed without an audited override.

### 7.5 Recommendation seam (modular, swappable)
A clearly named interface in `core` for recommendations, with a content-based and curated baseline implementation that uses catalog attributes, the customer profile and past orders, in-session behaviour, fit outcomes, and reorder behaviour. The interface is the seam for a future machine-learning model. Capture consented signals from the start so a later model has training data. Body measurements are used only for fit relevance inside the boundary; broader profiling is consent-gated.

### 7.6 Email provider abstraction
An interface in `core` or `db` for sending transactional email, with a Resend implementation behind it. All sending goes through the interface. Emails and the printed parcel card are rendered in the order's frozen locale. Templates: order confirmation, status updates, supplier production email with PDF and images, remake and refund updates, reorder reminder, welcome, post-purchase care, and admin notifications.

### 7.7 Money and VAT
All money is stored in minor units (Rappen). The displayed price equals the price paid, including standard shipping and VAT. Admin prices are entered gross. VAT is computed and recorded by Shopify on the draft order (tax inclusive), so the customer sees no VAT line and the displayed price stays constant when VAT registration applies. Provide `core` helpers for formatting CHF per locale and for the gross, net, and VAT split used on confirmations and the later VAT invoice.

### 7.8 Internationalization
Four locales (DE, EN, IT, FR), German default and fallback, locale-prefixed URLs, browser-language auto-detection with a manual switcher. The chosen language is stored on the order always and on the account when registered, and drives emails and the parcel card. Catalog and content text come from the localized content store. Translations are reviewed, never raw machine output. Localized date, number, and CHF formatting, plus hreflang and localized SEO metadata.

### 7.9 Authentication and sessions
Customer auth is magic-link by email: request a link, verify a single-use token, create a server session in KV referenced by a signed, http-only cookie with a sane expiry. Guests can order without an account; if a guest later registers with the same email, attach prior guest orders. Admin auth is separate and stronger, on its own subdomain, with its own session store. Enforce ownership on every customer resource (a customer can only read or change their own profile and orders).

### 7.10 Rate limiting, observability, and config
KV-based rate limiting on public and authenticated endpoints (login requests, checkout creation, contact form). Observability via Workers Logs and Logpush with correlation ids on requests and webhooks, and an error-reporter interface (logs by default, a hosted tracker addable later). The typed config and feature-flag module gates auto-forward, alteration reimbursement, the photo method, and express shipping, per environment, without code changes.

---

## 8. Shopify integration (payment rail only)

Shopify is used solely to take payment and compute Swiss VAT. The catalog, configurator, pricing, accounts, and operations are all CUTURA's own.

- **App type:** a custom app on the single CUTURA store, using the Admin GraphQL API. Pin the API version and record it in `CONVENTIONS.md`. Store credentials as secrets.
- **Checkout creation:** when the customer pays, the storefront backend creates a Draft Order with a custom line item per garment, the server-computed price as a price override, the configuration and the measurement reference attached as line item properties, and a custom shipping line (standard shipping, included in the all-inclusive total). It then sends the customer to the Shopify-hosted checkout. Discounts, when used, are applied on the draft order.
- **VAT:** the store is configured for tax-inclusive Swiss VAT so Shopify extracts and records VAT from the gross price rather than adding it on top. The total equals the displayed all-inclusive price. Verify this in the live checkout test.
- **Webhooks:** HMAC-verified handlers for `orders/paid`, `orders/cancelled`, and refund events, plus Shopify's mandatory privacy webhooks. Each webhook is idempotent, keyed by the unique event id in `payment_event`, so a paid event is processed exactly once and creates exactly one production package. Use timing-safe comparison for the HMAC.
- **Reconciliation:** a scheduled job (Cron Trigger) reconciles recent orders against Shopify as the source of truth, to catch any missed or duplicated event.
- **Refunds:** issued through Shopify and reflected in order status. The customer keeps the original garment at launch (no return required for the fit-guarantee refund fallback).
- **Open verification (live test before launch):** confirm TWINT and the wallet methods appear on the draft checkout, confirm the draft checkout uses CUTURA's custom shipping line and does not force a Shopify rate, and confirm VAT is recorded tax inclusive so the total equals the displayed price.

---

## 9. Testing and quality harness (E15)

This harness is foundational and is built in M0, then maintained throughout. Its purpose is to make broken work visible, which directly answers the past failure where everything reported green while the deployed app was not serving.

### 9.1 Test layers
- **Unit (Vitest):** the `core` domain logic. The estimator, the three-layer model and versioning, the status machine and guards, the pricing and VAT math, and the snapshot builder. These must never silently break.
- **Integration (Vitest with the Workers test pool):** the seams that failed before. The idempotent paid webhook, draft order creation with the right price, shipping line, and properties, the supplier email and PDF generation with embedded images, and D1 reads and writes including the publish routine.
- **End to end (Playwright):** the real journeys against a running build, on desktop and mobile viewports. Discover, configure, measure, checkout (against a Shopify test mode or a stubbed payment boundary), and the admin approve-and-forward flow. Assert the happy-path step and field budget so friction cannot creep back.
- **Regression:** every fixed bug and past failure class gets a test that locks it. Includes the deploy smoke test below.
- **Visual and UI sanity:** render key pages and screenshot them across breakpoints in CI. A reviewer (human or the product and UX agent) inspects the rendered output rather than only asserting code ran. This is the check for orphan or redundant fields and awkward layouts.

### 9.2 Deploy smoke test (mandatory)
After every deploy, an automated smoke test hits the deployed URL and fails loudly if the app is not actually serving the expected pages and key endpoints. Production is not considered released unless the smoke test passes. This single check would have caught the worst past incident.

### 9.3 Definition of done
A change is done only when: the relevant tests are written and passing in CI, the change is verified against a running environment (Staging), the deploy smoke test is green, and the UI and UX checklist passes for any screen touched. Reporting completion without this evidence is not done.

### 9.4 CI as the gate
CI runs typecheck, lint, unit and integration tests, build, and (on deploy) the smoke test. Merging to the trunk and deploying are blocked unless CI is green. CI, not the agent's word, is the gate.

### 9.5 UI and UX checklist (enforced per screen)
No orphan or redundant fields. Every input wired to real state and submission. Labels and validation present. Consistent components. Mobile and desktop both verified. The low-friction path preserved.

### 9.6 Living conventions for the agent
`docs/CONVENTIONS.md` is read by the agent before every change and kept current. It records the architecture rules (Cloudflare only, own catalog, allow-lists only, the estimator and recommendation seams and where they live), naming, the reserved OpenNext binding names, the pinned Shopify API version, and the invariants that must never change silently (confirmed measurements, the immutable snapshot, QC fails never dropped, server-authoritative pricing).

### 9.7 Specialized review agents (only where they earn their place)
- **Product and UX reviewer:** holds the customer perspective and business goals. Reviews changes and rendered pages, flags friction, awkward flows, redundant or confusing UI, and drift from the requirements, and asks whether a real shopper would complete the task.
- **QA and test-integrity reviewer:** distrusts green. Checks that tests assert real behaviour, that changed code is covered, and that no test was weakened or skipped to pass.
- **Security and privacy review:** a lighter checklist role (not a full third agent) given the sensitive measurement data: encryption at rest, ownership checks, deletion completeness, secret handling, timing-safe comparisons.

---

## 10. CI/CD and release process

Lean trunk-based flow for one founder and one agent. No multi-developer ceremony.

### 10.1 Branching and CI
- `main` is the trunk. The agent works on a short-lived branch and opens a pull request.
- CI on every pull request and on `main`: typecheck, lint, unit and integration tests, build. Merge is blocked unless green.

### 10.2 Staging deploy (automatic)
- On merge to `main`, CI deploys both apps to Staging via Wrangler, applies pending migrations to the control and Staging databases, and runs the deploy smoke test against `staging.cutura.ch`. Staging always runs the latest `main`.

### 10.3 Production deploy (manual and gated)
- The founder triggers a one-click "Release to Production" GitHub Actions workflow (workflow_dispatch). It deploys current `main` to Production, applies pending migrations to the Production database, then runs the deploy smoke test against `cutura.ch`. If the smoke test fails, the release is marked failed.
- Tag each production release (for example a date or semantic tag) for traceability.

### 10.4 Migrations
- Drizzle Kit generates SQL migrations. CI applies them with Wrangler as part of each deploy, per the target databases.
- Migrations are backwards-compatible (expand then later contract), because a code rollback does not revert the schema. Never ship a migration that breaks the currently deployed code.

### 10.5 Rollback
- Code: `wrangler rollback` immediately re-points Production to the last good version. Know the caveats: it does not revert database, KV, or R2 changes, it uses current secret values, and it is blocked if a Durable Object migration happened between versions. Because migrations are backwards-compatible, a code rollback is safe with the existing schema.
- Data: D1 Time Travel restores a database to any minute in the last 30 days (`wrangler d1 time-travel restore`), and `wrangler d1 export` takes an off-platform copy. Document both as runbooks.

### 10.6 Secrets and infrastructure as code
- Secrets in Cloudflare Workers secrets and GitHub Actions encrypted secrets, never in the repository.
- Wrangler configuration per app and environment is committed under `infra/wrangler`. Creating the databases, KV namespaces, R2 buckets, and DNS is documented as a one-time setup runbook in the README.

### 10.7 The two founder-executable releases
- Code release: the agent merges, CI deploys to Staging, the founder verifies on `staging.cutura.ch`, then clicks Release to Production, and the smoke test confirms.
- Catalog release: the founder builds an item in the admin as Draft, publishes to Staging, verifies on the staging shop, then publishes to Production.
Both are documented step by step in the README.

---

## 11. Build plan (milestones)

The plan is vertical-slice-first: prove one shirt fully orderable end to end (M3) before widening. No hour estimates; build in order. Each milestone lists its goal, the main requirement identifiers it satisfies, the key work, and an acceptance gate that must be met with real evidence before moving on.

### M0. Foundation and quality harness
**Status:** DONE (2026-06-24, commits 2b16837..c01f00e, merged to main). Code-side complete and gate-green; the live staging deploy + smoke await Cloudflare provisioning (`infra/setup-runbook.md`).
**Goal:** a deployable skeleton on Cloudflare with the quality gate live from day one.
**Covers:** NFR-01 to NFR-09, NFR-15, NFR-19; E15 (FR-1501 scaffolding, FR-1520, FR-1530, FR-1531, FR-1540, FR-1550, FR-1560, FR-1570, FR-1580, FR-1590).
**Key work:**
- Initialize the pnpm monorepo and the structure in Section 4. Configure TypeScript strict, ESLint, Prettier, Tailwind preset.
- Scaffold `storefront` and `admin` as Next.js apps with the OpenNext adapter and Wrangler configs for Staging and Production (and the admin control plane). Account for the reserved OpenNext cache bindings.
- Create the three D1 databases, KV namespaces, and R2 buckets. Wire bindings. Set up `.dev.vars.example` and the secret names.
- Stand up `packages/core`, `packages/db`, `packages/config` as empty but wired packages.
- Build the CI workflow (typecheck, lint, test, build) and the Staging deploy workflow, plus the gated Production release workflow. Implement the deploy smoke test.
- Seed `CONVENTIONS.md` and the README skeleton with the setup and release runbooks.
**Acceptance gate:** both apps deploy to Staging through CI, the deploy smoke test passes against `staging.cutura.ch`, CI blocks a deliberately failing test, and a trivial change can be promoted to Production with the gated workflow and a green smoke test.

### M1. Data model and ported domain core
**Status:** DONE (2026-06-24, commits 3534c9b + 49a37f7, merged to main). Full 41-table Drizzle schema + migration + seed; `packages/core` ported and unit-tested (57 tests). Remote migration apply to the three D1 DBs runs in CI once provisioned.
**Goal:** the schema exists and the safety-critical logic is ported and unit-tested.
**Covers:** the data model in Section 6; E5 core (FR-501, FR-510, FR-520, FR-521 to FR-524, FR-530, FR-531, FR-540, FR-550, FR-551, FR-570, FR-580 to FR-592); E1 pricing (FR-150 to FR-152); E8 status and snapshot (FR-810, FR-811, FR-820 to FR-822); FR-1501.
**Key work:**
- Write the Drizzle schema for catalog, operational, and configuration tables per Section 6, with JSON columns and the immutability and audit patterns.
- Generate the first migrations and apply them to all three databases via CI.
- Port into `core`: the three-layer measurement model and versioning, the status machine and guards, the pricing engine, the estimator interface plus the rule-based shirt and trouser modules, validation, the snapshot builder, and the money and VAT helpers.
- Unit-test all of the above, including disallowed transitions, the no-silent-change rule, VAT extraction, and snapshot immutability.
- Write the Staging seed script (test catalog and test data).
**Acceptance gate:** migrations apply cleanly to all three databases, the seed populates Staging, and the `core` unit suite is comprehensive and green in CI.

### M2. Catalog platform and admin control plane
**Status:** DONE (2026-06-24; commits e29633f onward, merged to main). All workstreams complete: WS-A admin auth + crypto + audit; WS-B publish routine + Workers test pool; WS-C catalog data-layer; WS-D admin CRUD UI for all 8 entity types (garment types, base models + allow-lists, fabrics, option groups + values, upgrades, collections + members, attributes, supplier); WS-E R2 image upload; WS-F storefront catalog read API; WS-G docs + ADR 0002. The no-code-catalog -> publish -> storefront-read loop is built and proven on real D1 (Workers-pool integration tests). Deferred: per-item attribute-value assignment (M6 discovery), public storefront media serving (go-live). The LIVE demonstration (publish to the deployed staging env, view on the deployed storefront) awaits the founder Cloudflare provisioning in `infra/setup-runbook.md`.
**Goal:** the founder can build the catalog with no code and publish it to an environment.
**Covers:** E1 (FR-101 to FR-104, FR-110 to FR-112, FR-120 to FR-123, FR-130 to FR-132, FR-140 to FR-143, FR-160, FR-161, FR-170 to FR-172, FR-180, FR-181, FR-190 to FR-192, FR-1A0, FR-1A1, FR-1B0 to FR-1B2, FR-1C0, FR-1D0, FR-1D1); E2 (FR-201 to FR-280, FR-2A0, FR-2A1, FR-2C0, FR-2D0, FR-2E0); FR-260, FR-261, FR-1570.
**Key work:**
- Admin authentication (separate from customers) and the audit trail.
- CRUD for garment types, base models, fabrics, options, upgrades, collections, and structured attributes, with localized content entry and incomplete-locale surfacing.
- R2 image upload with primary and ordering, plus graceful fallback.
- Pricing configuration (base, surcharges, upgrade prices) and the per-model allow-lists (no deny rules).
- Draft state and publishing to Staging or Production via the publish routine in `packages/db` (idempotent, transactional, audited), with the dependency-graph resolution.
- View-only and fabric-availability toggles. Draft preview.
**Acceptance gate:** the founder creates a garment type, a shirt model, fabrics, options, upgrades, and a collection entirely in the admin, publishes them to Staging, and sees them on the staging storefront catalog API, while nothing reaches Production and drafts appear nowhere.

### M3. Vertical slice: one shirt orderable end to end
**Status:** DONE code-side (2026-06-24; commits d86d198 onward, merged to main, gate-green). All workstreams complete: WS-A encryption + base64 HMAC + schema/env; WS-B PDP + configurator + server-authoritative /api/price; WS-C measurement flow (wizard/detailed, three layers, outlier gate, cm/inch); WS-D guest cart + pre-checkout validation + versioned legal; WS-E Shopify draft-order boundary (Admin GraphQL 2026-04) + /api/checkout; WS-F paid webhook (raw-body HMAC, idempotent) + reconcile; WS-G order pipeline (immutable snapshot, guarded status machine, QC no-silent-pass + audited override, ship-together) with 22 Workers-pool tests; WS-H supplier spec + pdf-lib PDF + Resend email; WS-I minimal admin order-ops; WS-J ADR 0003 + docs. Guest-only (accounts are M4). **The LIVE half of the gate** (real draft order, TWINT, paid webhook, emails, the end-to-end Playwright + manual test order) awaits the founder Shopify custom app + Resend + Cloudflare provisioning - see `infra/setup-runbook.md` section 7. Deferred follow-ups: reconcile cron trigger; supplier-PDF fabric/option/upgrade images (model image done); full GDPR webhook handling; checkout rate limit.
**Goal:** a single shirt flows from discovery to shipped on Staging, on desktop and mobile. This is the integration-risk-killer and the proof of the architecture.
**Covers:** E3 core (FR-301, FR-320, FR-321, FR-380); E4 (FR-401 to FR-461); E5 customer flow (FR-510 to FR-592, FR-5B0, FR-5B1); E7 (FR-701, FR-702, FR-710 to FR-790, FR-7B0, FR-7F0, FR-7F1, FR-7J0); E8 (FR-801, FR-802, FR-810, FR-811, FR-820 to FR-862, FR-870 to FR-891, FR-8C0); E9 (FR-901, FR-910, FR-920, FR-930, FR-940); E13 price-display and VAT (FR-13A0, FR-720 to FR-722).
**Key work:**
- Storefront: a home page, the product page reading from the published catalog, and the configurator (fabric, options, upgrades, live server-authoritative price, allow-list-driven choices, required-field gating, the low-friction fast path).
- Measurement flow: detailed entry and the quick wizard with the estimator, the three-layer model, transparent confirmation, the outlier and review gate, the per-piece override hidden behind an advanced control, and the unit switch.
- Cart and checkout: full configuration and measurement reference carried through, server price recomputed, the Shopify Draft Order with price override, custom shipping line, and properties, the hosted checkout, and the all-inclusive price with VAT shielded.
- Order pipeline: the idempotent paid webhook creating the immutable production package, the status machine, the manual approval gate, the supplier email and PDF with embedded images, the QC checklist with the pass, fail, and override gate (fails never dropped), and shipping release.
- Emails: order confirmation and status emails in the order locale, and the supplier production email.
- Restrict shipping to Switzerland and Liechtenstein.
**Acceptance gate:** an end-to-end Playwright run completes a real test order for one shirt from discovery to shipped on Staging, desktop and mobile; the price is server-computed and VAT is recorded tax inclusive; the supplier PDF is complete with images; a QC fail cannot become a pass without an audited override; and the happy-path step budget holds. The founder also performs one manual order through the Shopify test checkout.

### M4. Customer accounts and self-service
**Status:** DONE code-side (2026-06-24; commits 9656e73 onward, merged to main, gate-green). All workstreams: WS-A magic-link auth + KV customer sessions; WS-B claim guest orders + migrate guest measurement on register; WS-C profile management (view/rename/archive/revise, ownership) + migration 0002 (archived_at) + account-aware measurement flow; WS-D order history + customer status timeline + public guest tracking; WS-E address management; WS-F one-click reorder (keep/update/override, per-line checkout measurement + customerId); WS-G fit review + remake-from-snapshot + refund decision; WS-H post-delivery fit feedback; WS-I data deletion (delete personal data, scrub-keep orders) + export - the privacy gate; WS-J ADR 0004 + docs. Every customer helper is ownership-filtered with cross-customer rejection tests. Guest-only (M3) remains; multiple profiles per customer deferred (Future). The LIVE half (real magic-link emails, the end-to-end Staging flow) awaits Resend + Cloudflare provisioning. Follow-ups: execute the Shopify refund from the admin decision (function exists, live-deferred); fit-review photo serving.
**Goal:** the registered customer experience and the retention mechanics.
**Covers:** E6 (FR-601 to FR-6E0); E5 multiple-profile remains Future; E8 remake (FR-8A0 to FR-8A3, FR-8B0).
**Key work:**
- Magic-link auth and sessions, account recovery, and guest-order claiming on registration.
- Profile management with ownership enforcement, order history with status and configuration summaries, address management, and the customer-facing status timeline.
- One-click reorder with the keep, update, or override choice, freezing into a new snapshot.
- Fit-review and remake request with reason and photos, and the detailed fit-feedback form with few mandatory fields.
- Customer data deletion across all tables and data access and export.
**Acceptance gate:** a registered customer can log in by magic link, reorder with each of the three size choices, raise a fit review, submit feedback, and delete their data completely, all verified end to end on Staging.

### M5. Operations and backoffice
**Goal:** the founder can run the full operational loop.
**Covers:** E10 (FR-1001 to FR-10D0); E2 shipping and supplier and capacity (FR-280, FR-290, FR-2A0 to FR-2B2); E9 admin notifications (FR-950).
**Key work:**
- The status-grouped pipeline board with the review and outlier lane and the awaiting-customer-info lane, and the approve-and-forward action.
- Outlier surfacing that actually displays, the fit-review queue, and audited pre-release corrections.
- Customer and supplier management, internal notes and tags, the communication log, and the KPI dashboard and cost capture.
- Shipping configuration, the supplier entity, the capacity cap, vacation and pause mode with the calm message, and capacity-aware lead times.
- Admin email notifications for new order, needs review, and QC due. CSV export.
**Acceptance gate:** the founder processes test orders through the board including approval, handles a fit review, pauses ordering via the capacity cap and via vacation mode with the customer-facing message, and exports data, all on Staging.

### M6. Internationalization, discovery, and content
**Goal:** the full storefront in four languages with real discovery and trustworthy content.
**Covers:** E12 (FR-1201 to FR-1280); E3 discovery and content (FR-310, FR-311, FR-330 to FR-372, FR-390, FR-391, FR-3A0, FR-3B0, FR-3D0); E9 localized emails and parcel card (FR-930, and E8 FR-8E0 packaging); E11 baseline (FR-1101 to FR-1142) optionally begins here.
**Key work:**
- Four locales, locale detection, locale-prefixed URLs, the language memory driving emails and the parcel card, reviewed translations, localized formatting, and hreflang and localized SEO.
- Smart discovery: filtering and sorting by customer-centric attributes, occasion browsing, the calm view-only treatment with notify-me, search, configuration sharing, and designed empty and error states.
- Editable content and legal pages (navigation hardcoded for now), the fit and size guide, and trust content.
- The packaging step that prints the localized parcel card.
**Acceptance gate:** the storefront works in all four languages with correct URLs, detection, and fallbacks; an order placed in each language produces emails and a parcel card in that language; discovery filters and occasion browsing work; and SEO metadata and hreflang validate.

### M7. Compliance, trust, and hardening
**Goal:** lawful, private, performant, accessible, and operationally safe.
**Covers:** E13 (FR-1301 to FR-13D0); NFR-08, NFR-10 to NFR-18, NFR-20; E15 visual and smoke checks reinforced.
**Key work:**
- Encryption at rest for body measurements, full deletion across all tables verified, retention rules, and the consent banner gating analytics and broader profiling.
- VAT correctness and invisibility confirmed end to end, fibre composition on the product page and the language-neutral sewn-in label spec carried into the supplier package, the published fit-guarantee policy, terms and privacy version capture, and measurement data residency in Switzerland or the EU.
- Accurate, versioned legal pages with real company data and no fabricated citations (lawyer-review hook), the contact form and help section.
- Performance budgets with Lighthouse and Core Web Vitals in CI, accessibility to WCAG 2.2 AA with the configurator and wizard specifically covered, rate limiting, bot protection on account, contact, and checkout, maintenance mode, the SEO infrastructure (sitemap, structured data, redirects), and the tested backup and restore drill using Time Travel and export.
**Acceptance gate:** the compliance and NFR checklist is green, a deletion removes all of a customer's data, a restore drill succeeds, performance and accessibility checks pass in CI, and the legal pages carry real data pending lawyer sign-off.

### M8. Second garment type and recommendations
**Goal:** prove that a new garment type is data plus a module, and turn on personalization and multi-item orders.
**Covers:** E1 and E5 trouser as data (FR-104, FR-502, FR-523); E8 multi-item shipping (FR-850 to FR-852); E11 (FR-1101 to FR-1150); E2 and E14 bundles (FR-2E0, FR-1401).
**Key work:**
- Add the trouser garment type as data (measurement schema, supplier and QC templates) and register the trouser estimator module. No structural code change should be needed beyond the module.
- Multi-item orders: independent per-garment production and QC with a rolled-up order status, shipping released only when all items pass, shipped together in one parcel.
- The recommendation baseline and signal capture behind the swappable seam, plus curated cross-sell on product, cart, and post-purchase.
**Acceptance gate:** a trouser is orderable end to end with only data and a module added; a two-item order is produced and QC'd independently and ships together after all items pass; and recommendations and cross-sell surface appropriately.

### M9. Production launch readiness
**Goal:** go live for the soft-launch cohort.
**Covers:** Appendix C verification items; the launch-marked Must stories across all epics; the README runbooks finalized.
**Key work:**
- Promote the catalog and code to Production. Run the live tests: TWINT and wallets on the draft checkout, the custom shipping line, tax-inclusive VAT, and a real paid order on Production.
- Confirm company and legal data and obtain lawyer sign-off. Finalize SPF, DKIM, and DMARC. Complete the DNS cutover.
- Finalize the founder runbooks and rehearse the rollback and restore procedures.
**Acceptance gate:** a real end-to-end paid order completes on Production, every Appendix C item is confirmed, and the founder can independently execute the code release, catalog release, rollback, restore, and pause runbooks.

### Post-launch and Future
After M9, implement the Should and Post-launch items (roles, reorder reminders, lifecycle and marketing email, save and resume, bundles experience, KPI and cost detail) and then the Future stories (AI try-on, prompt-to-bespoke, photo and scan measurement, machine-learning personalization, auto-forward toggle, alteration reimbursement, resale of returns, multi-supplier routing, B2B and wedding, gift cards and loyalty, automated collections, multi-currency, reviews, journal, Spanish), each per its story in the requirements file and behind the seams and hooks already built.

---

## 12. README.md outline (founder-facing)

`docs/README.md` is written for the founder, not the agent, and is maintained like every other document. It contains the things the founder does that are not active development. Outline:
- What CUTURA is and the high-level architecture in plain terms (one shop, one admin, two environments, Shopify for payment).
- One-time setup: creating the Cloudflare resources, configuring DNS for `cutura.ch`, `www`, `staging.cutura.ch`, and `admin.cutura.ch`, setting secrets, and connecting the Shopify custom app.
- Releasing code: merge the agent's pull request, verify on `staging.cutura.ch`, click Release to Production, confirm the smoke test is green.
- Publishing catalog: build an item in the admin as Draft, publish to Staging, verify on the staging shop, publish to Production.
- Rolling back code: how to run a rollback and the caveats (schema is not reverted, secrets use current values).
- Restoring data: how to use D1 Time Travel and export.
- Pausing orders: the capacity cap and vacation mode, and editing the customer-facing message.
- Running the Staging seed and refreshing test data.
- Reading CI status and what a failed gate means.
- If something breaks: maintenance mode and who to contact.
Keep it step by step and copy-pasteable.

---

## 13. Risk register (past failure modes and how this plan prevents them)

| Past failure | Prevention in this plan |
|---|---|
| Tests reported green while the deployed app was broken | Mandatory deploy smoke test gating Production, end-to-end tests against a running build, and a definition of done that requires running-environment evidence (Section 9). |
| API deploy silently broken for weeks (missing runtime dependency) | One Cloudflare deployment per environment with the smoke test on every deploy, and CI building the actual deployable artifact. |
| QC failures silently discarded while packages still passed | The status machine forbids a qc_failed item becoming qc_passed without an audited override, with a regression test locking it (Sections 7.4, 9). |
| Fabricated legal citation shipped in the terms | Legal pages carry real company data, are versioned, and require lawyer sign-off before launch; no invented citations (FR-1360 to FR-1362, M7). |
| Deletion missed a table (privacy gap) | Deletion is specified across all tables and verified by test; the data model enumerates every personal-data table (Sections 6, 9, M4, M7). |
| Configured price never reached checkout (Shopify variant limit) | Own catalog and server-authoritative pricing, with the price passed as a draft-order price override (Sections 7.1, 8). |
| Catalog maintenance pain via Shopify plus code sync | Own no-code catalog admin with publish-to-environment, no Shopify catalog (Sections 5.3, M2). |
| Test data injected into the production database | Hard environment isolation by separate databases; test data lives only in Staging by construction (Sections 5.2, 5.3). |
| Lint never ran; quality eroded as the app grew | CI gate with lint and typecheck, the UI and UX checklist, the living conventions document, and the review agents (Sections 9, 10). |
| Stale or wrong price on an in-progress cart | Price recomputed at checkout and historical orders immutable (FR-1D0, FR-1D1, FR-7J0). |

---

## 14. Sequencing and dependencies

- M0 precedes everything: nothing is built without the harness and the deploy gate.
- M1 (schema and core) precedes M2 and M3, because catalog and the slice depend on the schema and the ported logic.
- M2 (catalog and publishing) precedes M3, because the storefront reads published catalog.
- M3 is the integration milestone and must pass before widening. Treat it as the highest-value checkpoint.
- M4, M5, and M6 can be approached in that order but share dependencies on M3's primitives (accounts, orders, status board, localization). Localization (M6) should land before any public soft launch.
- M7 (compliance and hardening) must complete before M9. Some items (encryption at rest, ownership checks, rate limiting) should be implemented as their feature lands rather than retrofitted, but M7 is the explicit gate.
- M8 proves extensibility and turns on personalization; it can run in parallel conceptually but is sequenced after the single-shirt loop is solid.
- M9 is the launch gate: live payment verification, legal sign-off, DNS cutover, and runbook rehearsal.

---

## 15. Appendices

### Appendix A. Secrets and binding names (to finalize during M0)
- Secrets: email provider API key, Shopify API credentials, Shopify webhook signing secret, measurement encryption key, session signing secret, admin auth secret. None in the repository; documented in `.dev.vars.example`.
- Storefront bindings: environment D1 (`DB`), KV (sessions and rate limiting), R2 (`MEDIA`), plus the OpenNext reserved cache bindings.
- Admin bindings: `CONTROL_DB`, `STAGING_DB`, `PRODUCTION_DB`, R2 for each target, KV for admin sessions.
- Confirm the exact OpenNext reserved binding names against the adapter version pinned in M0 and record them in `CONVENTIONS.md`.

### Appendix B. Open verification items (live tests before launch)
- TWINT and wallet methods appear on the Shopify draft checkout.
- The draft checkout uses CUTURA's custom shipping line and does not force a Shopify rate.
- Shopify records Swiss VAT tax inclusive so the total equals the displayed all-inclusive price.
- The Swiss textile labeling basis confirmed with a legal or compliance advisor.
- Company and legal data in the policy pages confirmed by a lawyer.

### Appendix C. Explicitly deferred (decide later, do not build now)
- Frontend and process choices are all decided; nothing architectural is deferred.
- Product scope deferred to Future per the requirements: AI try-on, prompt-to-bespoke, photo and scan measurement, machine-learning personalization, auto-forward toggle, alteration reimbursement, resale of returns, multi-supplier routing, B2B and wedding, gift cards and loyalty, automated collections, multi-currency, reviews, journal, Spanish, editable navigation menu. The seams and hooks for these are built; the features are not.

### Appendix D. Agent operating instructions (read before starting)
- Read the requirements file, then this plan, then `CONVENTIONS.md`.
- Work milestone by milestone in order. Do not start a milestone until the previous gate is met.
- For each change, write tests, satisfy the definition of done, and cite the US and FR identifiers in the pull request.
- Never weaken or skip a test to make CI pass. If a test is wrong, fix the test deliberately and say why.
- Keep migrations backwards-compatible. Never ship a migration that breaks the deployed code.
- Do not add dependencies or services not justified by this plan. Prefer the smallest robust solution.
- If the requirements and the plan conflict, or if a decision is genuinely ambiguous, stop and ask the founder rather than guessing.
- Keep `CONVENTIONS.md` and the README current as part of the work, not as an afterthought.

---

*End of implementation plan. Build the harness first, prove one shirt end to end, then widen. Keep it simple, keep it verified, keep it reversible.*
