# CUTURA coding agent instructions

This file guides any coding agent (Claude Code or similar) working in this repository. Read it at the start of every session. It is the operating manual. The deep specifications live in the canonical documents below.

---

## Product context

CUTURA is a Swiss direct-to-consumer brand for made-to-measure clothing. A customer configures a garment online (model, fabric, style options, optional add-on upgrades), provides body measurements, and pays. The garment is produced on demand by a tailor in Vietnam, received and quality-checked in Switzerland, then shipped to the customer.

This repository is a from-scratch rebuild on consolidated Cloudflare infrastructure. The platform is designed to be garment-type-general (any garment eventually, added as data) but launches deliberately narrow: a few shirts and a few trousers, serving Switzerland and Liechtenstein. The hard, tested domain logic from the previous build is ported into `packages/core`, not reinvented.

The product visualizes and fulfills custom orders. It is a commerce and operations system, not a marketplace.

## Canonical documents and conflict priority

- `docs/REQUIREMENTS.md` (CUTURA user stories and requirements): the source of truth for product behaviour.
- `docs/PLAN.md` (CUTURA implementation plan): the source of truth for structure, stack, and process, including the milestone build order.
- `docs/CONVENTIONS.md`: living conventions and volatile specifics (pinned third-party versions, reserved binding names, exact commands as they solidify).
- `README.md`: founder-facing operating manual (releasing, publishing catalog, rollback, restore, pausing orders).

If sources conflict, use this priority:

1. Current explicit founder instruction
2. `docs/PLAN.md` for technical architecture and process
3. `docs/REQUIREMENTS.md` for product requirements
4. `docs/CONVENTIONS.md` for conventions and current specifics
5. Older or historical docs for context only

If the requirements and the plan genuinely conflict, or a decision is ambiguous and blocking, stop and ask the founder. Do not guess silently.

---

## Non-negotiable style rules

- Never use the Unicode em dash U+2014 anywhere: code, comments, docs, UI copy, commit messages, test names, seed data, or markdown. Avoid all long dash characters. Use the plain ASCII hyphen-minus `-`. The quality gate must fail if U+2014 appears in tracked files.
- Default to no emojis. Use one only if the founder asks or a specific UI context clearly benefits.
- Keep UI copy, docs, and comments professional and trustworthy in all four languages. Avoid an AI-generated tone, hype, filler, and fake enthusiasm.
- Visible copy serves trust. Do not write keyword-stuffed or awkward SEO text in the user interface. SEO lives in metadata, not in the words a customer reads.
- Prices shown to the customer are all-inclusive and equal the price paid. Never present VAT as a separate customer choice or add it on top of a displayed price. Never imply a fit, delivery, tax, or production outcome is guaranteed; communicate lead times and policies plainly.

---

## Architecture invariants

These hold across the codebase. Do not violate them without an explicit founder decision recorded in `docs/DECISIONS/`.

- Everything runs on Cloudflare: Workers (via the OpenNext adapter, Node runtime), D1, KV, R2, Cron Triggers. Shopify is used only as the payment rail. An email provider is the only other external service.
- The catalog is owned. Garment types, models, fabrics, options, upgrades, collections, attributes, prices, and per-model allow-lists live in CUTURA's own database. There is no Shopify catalog, metaobjects, metafields, or Shopify collections.
- Compatibility is expressed only as per-model allow-lists. There are no deny or exclusion rules anywhere.
- Pricing is server-authoritative. The configured price is computed and validated on the server from catalog data and recomputed at add-to-cart and at checkout. The client never sets or sends a price.
- Two environments are isolated by construction: Staging and Production have separate D1 databases and separate deployments and share nothing at runtime. A control database holds the canonical catalog and drafts; publishing copies an entity into a target environment database. An item published only to Staging can never reach Production because Production is a different database.
- The safety-critical domain logic lives in `packages/core` as pure TypeScript (no Next.js, React, or Cloudflare imports) and is unit-tested there: the three-layer measurement model and versioning, the status machine and guards, the pricing engine, the estimator interface and modules, validation, and the snapshot builder.
- Confirmed measurements never change silently. A change creates a new version. The order snapshot is immutable: written once at purchase, never updated.
- The status machine guards every transition. A QC fail can never become a pass without an audited override. Shipping releases only after QC pass or an audited override.
- The fit estimator runs on the server behind a clearly named, swappable interface, with a rule-based default and per-garment-type modules. If estimation fails, detailed manual entry still works.
- Recommendations run behind a swappable interface, with a content-based and curated baseline now and a machine-learning model later. Body measurements are used only for fit relevance inside the boundary, never for cross-customer profiling.
- Orders are ingested exactly once. The Shopify paid webhook is HMAC-verified (timing-safe) and idempotent, keyed by the unique event id, and creates exactly one immutable production package.
- The manual approval gate is invisible to the customer. An order waits in review until the founder approves it in the admin, which forwards the spec to the tailor by email with a PDF. Auto-forward is a future toggle.
- Multi-item orders ship together in one parcel. Each garment is produced and QC'd independently; shipping releases only when every item has passed QC.
- No payment data is stored by CUTURA. Body measurements are encrypted at rest. Measurement data resides in Switzerland or the EU.
- Migrations are backwards-compatible. A Workers rollback does not revert the schema, so never ship a migration that breaks the currently deployed code. Data recovery uses D1 Time Travel.

---

## Repository structure

```
apps/
  storefront/   Next.js customer storefront (OpenNext -> Worker). Deployed to Staging and Production.
  admin/        Next.js admin and control plane (OpenNext -> Worker). Catalog editing, publishing, operations.
packages/
  core/         Pure domain logic and shared types. No framework or Cloudflare imports. Unit-tested.
  db/           Drizzle schema, migrations, query helpers, and the publish and promotion logic.
  config/       Shared lint, tsconfig, tailwind preset, typed env and feature-flag definitions.
infra/wrangler/ Wrangler config per app and environment (staging, production, control).
docs/           REQUIREMENTS.md, PLAN.md, CONVENTIONS.md, ARCHITECTURE.md, DECISIONS/, TESTING.md, SECURITY.md, PRIVACY.md, RELEASE.md
```

- `packages/core` is framework-free and Cloudflare-free. Keep it that way.
- `packages/db` owns the only code that writes published catalog rows into environment databases. Do not duplicate catalog writes elsewhere.
- The storefront contains no admin code. The admin owns the control plane and operations.

Environments: `cutura.ch` and `www` (Production), `staging.cutura.ch` (Staging), `admin.cutura.ch` (admin control plane).

## Data flow for an order

1. The customer configures a product and measurements on the storefront. The server computes the price.
2. At checkout, the backend creates a Shopify Draft Order with a custom line item per garment, the server price as a price override, the configuration and measurement reference as line item properties, and a custom shipping line. The customer pays on the Shopify-hosted checkout. Shopify records Swiss VAT tax inclusive.
3. Shopify fires `orders/paid`. The handler verifies the HMAC, is idempotent on the event id, and creates an immutable production package per garment.
4. The order waits in review. The founder approves in the admin, which sends the supplier the spec and a PDF with images.
5. The status machine progresses: new, in_review, approved, in_production, arrived_ch, qc_passed or qc_failed, awaiting_customer_info, shipped, problem. Every transition writes an append-only status event.
6. QC in Switzerland records a checklist outcome with photos. A fail cannot become a pass without an audited override. Multi-item orders ship together once all items pass.

---

## Commands and quality gate

Exact script names are discovered from `package.json` and kept in sync here and in `docs/CONVENTIONS.md`. Expected scripts:

```bash
pnpm dev                 # run apps locally (storefront and admin)
pnpm build               # build all workspaces
pnpm typecheck           # TypeScript across workspaces
pnpm lint                # ESLint across workspaces
pnpm test                # Vitest unit and integration (Workers test pool)
pnpm test:e2e            # Playwright end to end, when UI or flows changed
pnpm check:format        # Prettier check
pnpm check:dashes        # fails if U+2014 or other long dashes appear in tracked files
pnpm check:copy          # professional, advice-free, non-keyword-stuffed copy checks
```

Per app: `pnpm --filter storefront <script>` and `pnpm --filter admin <script>`. Database: Drizzle Kit for schema and migrations, applied via Wrangler. Deploy and rollback via Wrangler (`wrangler deploy`, `wrangler rollback`, `wrangler d1 time-travel`, `wrangler d1 export`).

After every push to `main`, check CI:

```bash
gh run watch --exit-status
gh run view --log-failed
```

Run the quality gate before every commit: lint, typecheck, test, the dash and copy checks, build, and `test:e2e` when UI or flows changed. The gate, not your judgment, decides whether a change is shippable.

The deploy smoke test is mandatory after every deploy. It hits the deployed URL and fails loudly if the app is not actually serving. Production is not released unless the smoke test passes.

---

## Engineering workflow

For every non-trivial task:

1. Explore first. Read the relevant files and the canonical docs before editing.
2. State the plan before broad changes. For customer-facing work, clarify behaviour and acceptance criteria first.
3. Write or update tests before or alongside implementation.
4. Implement in small increments.
5. Run the smallest relevant test first, then the full quality gate before commit.
6. Update documentation in the same logical change.
7. Commit a single coherent block with a descriptive message.

Build in the milestone order in `docs/PLAN.md`. Do not start a milestone until the previous acceptance gate is met with real evidence. Do not make broad refactors while implementing a feature unless necessary; if necessary, do the refactor as a separate commit with tests.

## Review subagents

- Use the product-and-ux-reviewer subagent for customer-facing behaviour, flows, scope, copy, onboarding, navigation, forms, errors, empty states, and acceptance criteria. Use it before implementation when product decisions are unclear or customer-visible behaviour may change.
- Use the qa-and-test-integrity subagent to review tests. It distrusts green: it checks that tests assert real behaviour, that changed code is covered, and that no test was weakened or skipped to pass.
- For security, privacy, payment, and measurement changes, perform an adversarial self-review against the security and privacy checklist before committing.
- Use the frontend-design-engineer subagent for customer-facing UI implementation and polish: layout, typography, spacing, color, components, responsive behaviour, interaction states, accessibility, and design-system consistency. Use it after product behaviour and acceptance criteria are clear, and before finalizing UI-heavy diffs.
---

## Test policy

- No new domain logic without tests.
- No bug fix without a failing regression test first, unless impossible; if impossible, explain why in the commit summary.
- No new UI flow without at least one automated test: component, integration, or Playwright end to end.
- Estimator and pricing tests are deterministic. Maintain golden fixtures for the estimator, pricing and VAT math, supplier spec and PDF, scenario snapshots, and migrations.
- Cover boundary cases: outlier and implausible measurements, missing required fields, the per-piece override, multi-item orders, a QC fail and override, a remake from a snapshot, refund and cancellation paths, locale fallback, and an unavailable fabric or view-only product.
- Lock every past failure class with a regression test, including the deploy smoke test that fails if the app is not serving.

---

## Code quality standards

- TypeScript strict. Avoid `any`; if unavoidable, isolate it, justify it, and add runtime validation.
- Validate at every boundary with zod: import and export, persisted data, API payloads, catalog publish, and Shopify webhook inputs.
- Prefer pure functions for domain logic. Keep it in `packages/core`. Do not duplicate domain or pricing formulas in UI code.
- Keep UI thin. UI components must not contain pricing, measurement, status, or entitlement business logic.
- Money is stored in minor units (Rappen). Treat currency, VAT, and locale explicitly.
- Use business language for names: garment type, base model, fabric, option, upgrade, collection, measurement profile, production package, snapshot, status, QC record, fit review, supplier, environment, publish target.
- Handle errors with typed results or well-defined exceptions. Never silently swallow pricing, estimation, persistence, or webhook errors.
- Do not suppress lint, type, or test failures. Fix root causes.
- Keep modules cohesive and small. Do not create god files.

---

## Security and privacy rules

- Body measurements are specially protected personal data. Encrypt them at rest. Minimize what is collected.
- Never log measurements, personal data, order contents, addresses, or payment details. Scrub error reports.
- Enforce ownership on every customer resource. A customer can only read or change their own profile and orders.
- Use the Shopify-hosted checkout. Never handle raw card data. Verify Shopify webhooks with timing-safe HMAC comparison.
- Rate-limit auth and magic-link, the contact form, checkout creation, and webhook-adjacent endpoints (KV based).
- Store only minimal account and entitlement data server-side. No saved payment methods.
- Analytics and broader profiling are consent-gated and must never capture measurements or order contents. Require explicit opt-in for optional analytics, sharing, or future AI features that process user data.
- Deletion removes all of a customer's personal data across all tables, with only documented legal or accounting exceptions retained. Feature gating must never trap user data: a customer can always export or delete their data.
- Measurement data resides in Switzerland or the EU. Document every third-party service that touches user data.

---

## Product and legal rules

- The displayed price is all-inclusive (standard shipping and VAT) and equals the price paid. VAT is invisible to the customer and recorded by Shopify tax inclusive. The only future exception is an optional paid express method.
- Fibre composition is shown on the product page and carried into the supplier spec. The sewn-in label is language-neutral (composition and international care symbols). Care text and the localized note go on the parcel card, not sewn into the garment.
- The fit guarantee is remake-first with a money-back fallback; the customer keeps the original at launch. Publish the policy clearly. Made-to-measure has no statutory online withdrawal in Switzerland; the guarantee is the trust mechanism.
- Legal pages (terms, privacy, imprint, shipping, fit guarantee) carry real company data, are versioned, and require lawyer sign-off before launch. Never invent or fabricate legal citations or claims.
- Record the accepted terms and privacy version on each order.
- Communicate lead times honestly with buffers. Never claim a guaranteed delivery, fit, tax, or production outcome.

---

## Git policy

- Trunk-based during early development. Committing directly to `main` is allowed if the quality gate passes. Keep commits small and logical.
- One coherent change per commit. Do not mix unrelated refactors, features, and formatting.
- Conventional commit style where practical: `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`, `ci:`.
- Include tests and documentation in the same commit as the behaviour change. Cite the relevant US and FR identifiers in the commit or pull request.
- Never commit secrets, tokens, keys, credentials, or real user data. Document required secret names in `.dev.vars.example`.
- Before committing, show a short summary of changed files, tests run, and remaining risks.
- Before launch, introduce the gated flow already specified: pull requests, required CI checks, automatic Staging deploy, and a manual gated Staging-to-Production promotion with the smoke test.

---

## Documentation policy

Documentation is part of the implementation, not a later cleanup. Update docs in the same commit when any of these change: architecture, data model, estimation method, the Shopify or VAT integration, a public API or package boundary, user-visible behaviour, feature gating or pricing, auth, payments, privacy, or security, setup, deployment, CI/CD, or environment variables, and known limitations or assumptions.

Maintain at least: `README.md` (founder-facing), `docs/CONVENTIONS.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS/` (ADRs), `docs/TESTING.md`, `docs/SECURITY.md`, `docs/PRIVACY.md`, `docs/RELEASE.md`, and `CHANGELOG.md`. Keep the commands section of this file in sync with `package.json`.

---

## AI agent behaviour

- Do not guess silently. If a decision is blocked, ask a concise question. If it is not blocked, make a reasonable assumption and record it in the commit or an ADR.
- Do not claim something is done unless commands have been run and results are visible. Prefer evidence: test output, build output, the deploy smoke result, or screenshots for UI changes.
- Verification beats self-report. A green report is not proof; the running build and the smoke test are.
- Use official documentation for Cloudflare, the OpenNext adapter, Drizzle, and Shopify when behaviour matters. These move quickly; do not rely on stale memory. Record pinned versions and reserved binding names in `docs/CONVENTIONS.md`.
- When context grows large, summarize current state, open tasks, decisions, and risks before continuing. For complex changes, plan and checkpoint after each meaningful phase.
- Keep it simple. Do not add dependencies, abstractions, or services that are not justified by the plan. Prefer the smallest robust solution.