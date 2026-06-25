# Changelog

All notable changes to this project. Newest first.

## Unreleased

### Added (Batch 10 - visual design system, WS0)

- A storefront visual identity, "Warmed Swiss Method": warm off-white surfaces, deep
  warm ink, a single restrained red accent, the self-hosted Inter typeface, tight radii,
  and calm spacing, expressed as Tailwind v4 `@theme` tokens. See
  docs/DECISIONS/0010-visual-design-system.md.
- A small storefront UI primitive layer (Button, Card, Section, Container, Price, Field,
  Input, Badge, Eyebrow) with a unit-tested button-variant helper, and a restyled
  header (active-section red underline), footer (localized labels), and reduced-motion
  handling. No change to pricing, measurement, or any product behaviour.
- A redesigned home page (hero, a numbered "how it works" process band, image-forward
  collection and model grids) and a redesigned discovery page, on one shared
  borderless product card. Placeholders now show a calm branded monogram while
  photography is pending.
- A redesigned, image-forward product page (two-column, sticky configurator on desktop)
  and a redesigned configurator: fabric swatch tiles, segmented option pills, upgrade
  toggle rows, a cross-fading all-inclusive total, and an ink call-to-action. Fabrics,
  options, and upgrades now show their catalog images once set and published. The
  pricing path is unchanged.
- Admin image management for the remaining catalog entities: fabrics and upgrades now
  have detail pages, and option groups and option values have image managers, all
  reusing one MediaManager (upload, set primary, delete). Previously only base models
  and collection banners could carry images.
- The cart, checkout, measurement flow, account, and the remaining content, legal, and
  status pages are restyled onto the design system (tokens, shared inputs and buttons,
  muted status colors). No change to cart math, the measurement steps, or checkout.
- The admin back-office is restyled onto the design system. Tailwind is now wired in the
  admin (it had none, which is why it rendered as unstyled HTML), with the brand tokens,
  the Inter typeface, a sticky top navigation with active-section highlighting, and
  consistent buttons, inputs, tables, and muted status colours across every page.
- Option pictures: the admin option-groups list now has an "Images" link (so per-value
  images, e.g. collar styles, are easy to find and add), and the configurator renders an
  option group whose values carry images as visual swatch tiles instead of a tiny
  thumbnail. Option groups without images keep the compact text options.
- A product image gallery: the product page now shows every published image for an item
  (a main image plus clickable, accessible thumbnails), not only the primary one. Single-
  image products show just the image; items without a photo keep the branded placeholder.
- Product-page images now show in full, never cropped: the main image and thumbnails fit
  the whole photo and the leftover space shows the warm panel (the listing grid keeps its
  uniform filled cards).
- The storefront can be kept private behind a password: set the `SITE_PASSWORD` secret on
  staging and the whole site requires HTTP Basic Auth (any username + the password);
  production leaves it unset and stays public. Health checks and webhooks are unaffected.
- A branded browser-tab icon (favicon) for the storefront and the admin.
- An editorial landing page: the home page now flows hero -> how it works -> fabric /
  craftsmanship -> a curated model preview (with "view all") -> trust / quality, with
  larger calm sections and better mobile rhythm instead of jumping into a product grid. A
  simple admin "Landing page" screen lets the founder upload three editorial images (hero,
  fabric, workshop) and edit the main text sections per language and environment, applied
  immediately (no publish step). Empty text falls back to built-in defaults.

### Added (M9 - launch-hardening follow-ups)

- A scheduled backstop that reconciles recent orders against Shopify, so a missed or
  duplicated payment notification is caught.
- Shopify data-protection (GDPR) webhooks: a deletion request erases the matching
  customer through the existing audited erasure path; data-export and shop-closure
  requests are recorded for the founder to action.
- Published catalog images are now copied to the live image store on publish, so they
  appear on the staging and production storefronts.
- A fit-guarantee refund can be executed from the admin decision when Shopify is
  connected (recorded only otherwise), with the outcome audited.
- Renamed the request middleware to the Next 16 `proxy` convention.

### Added (M8 - second garment type and recommendations)

- Trousers: a second garment type, added as catalog data plus the existing
  estimator module. The measurement flow now adapts its fields, estimation, and
  plausibility checks to the garment type, and measurements are kept separately per
  garment type so an order can mix a shirt and trousers.
- Multi-item orders with mixed garment types are produced and quality-checked
  independently and ship together once every item passes.
- Recommendations: a content-based and curated baseline behind a swappable
  interface, shown on the home page, product pages, cart, post-purchase, and the
  account. Curated cross-sell suggests trousers after a shirt and vice versa.
- Consent-gated capture of recommendation signals (for a future model), which hold
  no measurements or order contents and are deleted with the customer.

### Added (M7 - compliance, trust, and hardening)

- A cookie/tracking consent banner that gates analytics (opt-in; the single gate
  any future analytics must pass).
- Editable legal pages (terms, privacy, imprint, shipping, fit-guarantee) with a
  footer, plus a contact form and help links. Final legal text + lawyer sign-off
  are pending.
- Maintenance mode, broader rate limiting (checkout + contact) and a Turnstile
  bot-protection hook, product structured data, and an admin-managed redirects
  table.
- The language-neutral sewn-in label (composition + care symbols) carried into the
  supplier package.
- Accessibility linting in the gate, a Lighthouse + accessibility CI setup (runs
  against the deployed site), and a documented, scripted backup/restore drill.
- A compliance + NFR evidence checklist (docs/COMPLIANCE.md) with a data inventory
  and retention rules.

### Added (M6 - internationalization, discovery, and content)

- Public catalog image serving (safe raster-only serve) with images on the home,
  product, collection, and discovery pages.
- Browser-language detection with a manual switcher; SEO metadata, hreflang
  alternates, a sitemap and robots, and locale-aware date/number formatting.
- Editable content and legal pages (authored, published, rendered from the
  database); fibre composition on the product page.
- Attribute-driven discovery (filter and sort), occasion browsing, collection
  pages, localized search, and notify-me on unavailable items.
- Merchandising tools: per-item attribute assignment, collection banners, and
  curated cross-sell with product suggestions on the product page.
- A localized parcel card and an admin packaging step; designed empty and
  not-found states; seeded About, FAQ, and fit-guide content.

### Added (M5 - operations and backoffice)

- A status-grouped pipeline board with review/outlier lanes, and outlier warnings
  that now actually display on the board and the order detail.
- A fit-review queue with founder decisions, and audited pre-release corrections.
- Customer management (orders, profile, fit history; measurement views audited)
  and internal notes + tags on orders and customers.
- Supplier management with default routing, and shipping zone/method configuration.
- Capacity cap, vacation/pause mode with a configurable calm message, and
  capacity-aware lead times; the storefront pauses ordering server-side.
- A soft-launch KPI dashboard, per-order cost capture with margin, CSV order
  export (no measurements), admin email notifications, and an audit-log view,
  behind a shared admin navigation.

### Added (M4 - customer accounts and self-service)

- Passwordless magic-link authentication (single-use, hashed, rate-limited, no
  account enumeration) with KV-backed customer sessions and a gated account area.
- On registration: prior guest orders are claimed by email and the guest
  measurement is migrated into a durable, encrypted profile.
- Measurement-profile management (view, rename, archive, revise), order history
  with a customer status timeline, a public guest order-tracking page, and
  address management; the measurement flow is account-aware when logged in.
- One-click reorder (keep size, update to latest, or per-field override), the
  fit-review and remake flow (bounded, photos), post-delivery fit feedback, and a
  minimal admin decision action.
- Data deletion across all tables (personal data erased, order records scrubbed
  and retained for accounting, photos removed) and data export.

### Added (M3 - vertical slice: one shirt orderable end to end)

- Storefront customer flow: home, product page, a configurator with
  server-authoritative live pricing, and the measurement flow (wizard and
  detailed, three layers, transparent confirmation, outlier gate, cm/inch).
- A guest cart and a pre-checkout validation gate (complete config, valid
  measurement, Terms/Privacy version capture); a server-owned KV cart that stores
  no prices and recomputes at checkout.
- The Shopify payment rail (Admin GraphQL 2026-04): a draft order with a price
  override, custom config/measurement attributes, a 0.00 shipping line, and the
  hosted-checkout redirect; the paid webhook (raw-body HMAC, idempotent) and a
  reconcile backstop.
- The order pipeline: an immutable encrypted snapshot per garment, a guarded
  status machine with audit, a manual approval gate, multi-item rollup and
  ship-together, and QC with no silent pass and an audited override.
- A Workers-compatible supplier PDF (pdf-lib) and localized transactional email
  (Resend, behind a provider interface), plus a minimal admin order-ops surface.
- Body measurements encrypted at rest (AES-256-GCM via HKDF).

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
