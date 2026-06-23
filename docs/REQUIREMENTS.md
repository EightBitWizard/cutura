# CUTURA - User Stories and Requirements (Rebuild Specification)

**Version:** 1.0
**Date:** 2026-06-22
**Status:** Complete foundational specification for the from-scratch rebuild.
**Owner:** Malik (Founder)
**Supersedes:** `CUTURA_Anforderungen_Headless_Shopify.pdf` (v0.1, 07.03.2026) and `CUTURA_User_Stories_v2.md` (v0.1).

This document is the single source of truth for the CUTURA rebuild. It captures the product as user stories with acceptance criteria and formal requirements, written so that the founder, an external developer, and coding agents can all build from it. It is the most important document in the project. It should be kept current as decisions evolve.

---

## 1. Product in one paragraph

CUTURA is a Swiss direct-to-consumer brand for made-to-measure clothing. A customer configures a garment online (model, fabric, style options, optional add-on upgrades), provides body measurements, and pays. The garment is produced on demand by a tailor in Vietnam, received and quality-checked in Switzerland, and shipped to the customer. The platform is designed as a general made-to-measure system that can eventually offer any garment type, but it launches deliberately narrow with a few shirts and a few trousers, serving customers in Switzerland and Liechtenstein.

---

## 2. Target architecture (context for every requirement)

- **One infrastructure: Cloudflare.** Frontend and backend both run on Cloudflare (Workers, D1 for the database, KV for ephemeral state and rate limiting, R2 for media). Railway and Supabase are removed.
- **Own, data-driven catalog.** Garment types, models, fabrics, options, upgrades, collections, prices, attributes, and configuration rules live in CUTURA's own database and are managed in CUTURA's own admin. Shopify is not used for the catalog, metaobjects, metafields, or collections.
- **Server-authoritative configurator and pricing.** The configured price is always computed and validated on the server from catalog data. The client can never set or tamper with a price. This removes the structural Cart API price bug from the old build by construction.
- **Own customer accounts.** Accounts, sessions, measurement profiles, orders, and fit history live in CUTURA's database. The exact auth mechanism is an architecture-phase decision and the account stories are written to be independent of it.
- **Shopify as the payment rail only.** Checkout is created through Shopify Draft Orders with a price override and the configuration and measurement reference attached as properties, plus a custom shipping line. Shopify Payments handles cards, TWINT, and wallets, computes and records Swiss VAT, and remains the PCI boundary. CUTURA is not the merchant of record.
- **Ported domain logic.** The tested made-to-measure core from the old build is carried over rather than reinvented: the three-layer measurement model with versioning and immutable order snapshots, the status machine with guarded transitions, the QC workflow with the pass, fail, and override gate, the outlier and review gate, the garment-aware supplier spec, the measurement estimators, and the localized content.

---

## 3. How to read this document

### 3.1 Scope frame: platform-general, launch-narrow

| | At launch | Designed to support later |
|---|---|---|
| Garment types | A few shirts, a few trousers | Any garment (leather jackets, suits, and more) added as data and configuration, never as code |
| Markets and shipping | Switzerland and Liechtenstein only | Further countries without a rebuild |
| Languages | German, English, Italian, French | Spanish and others |
| Checkout | Shopify Draft Orders (payment rail only) | Optional later move to a different processor |

A new garment type means defining its option model, measurement schema, supplier-spec template, and QC template as data. New garment types are gated behind real operational readiness (supplier capability, a validated measurement schema, a defined QC checklist).

### 3.2 Conventions

- **Epics** are numbered `E1` to `E16`. **User stories** are `US-<epic>.<n>`. **Functional requirements** are `FR-<epic><nn>`. **Non-functional requirements** are `NFR-<nn>`.
- Each story has a narrative (As a role, I want a capability, so that a benefit), concise **acceptance criteria**, and a table of the **FR**s that operationalize it.
- **Priority:** `Must` (required for go-live), `Should` (valuable for go-live or first iteration), `Could` (nice to have).
- **Phase:** `Launch` (shirts and trousers go-live), `Post-launch` (soon after, once the launch loop is stable), `Future` (full vision, written as a proper story with its hooks, not yet scheduled).
- Future stories are real, fully specified stories carrying `Future` in the Phase column. They exist so the architecture anticipates them and does not block them.

### 3.3 Cross-cutting principles (apply to every story)

- **Simplicity for the customer.** The buying path stays short and legible. Depth (deep configuration, per-piece measurement override) is available but never blocks the simple route and never pops in the customer's face.
- **Trust by design.** Visible copy is professional in all four languages. Lead times and policies are communicated honestly. The made-to-measure promise is backed by the fit guarantee.
- **Privacy by design.** Personal data, especially body measurements, is minimized, encrypted at rest, used only for its stated purpose, and fully deletable.
- **Verification against reality.** Nothing is considered done because an agent or a test reports success. Done means proven against a running environment in CI (see E15).
- **Reversibility.** Every change is proven on Staging before Production and can be rolled back.

---

## 4. Decisions log (binding, with rationale)

These decisions were made jointly during specification and constrain the build.

1. **Full rebuild from scratch** on consolidated Cloudflare infrastructure, keeping the tested domain logic. Reason: the old multi-provider stack (Cloudflare, Railway, Supabase, Shopify, Resend) is too heavy for a solo founder and caused real fragility; the catalog pain and the price bug share one root cause that owning the catalog fixes.
2. **Own the catalog, use Shopify only for payment.** Reason: removes the daily Shopify-plus-code-sync maintenance and fixes the variant-price limitation that blocked configured surcharges.
3. **Two fully isolated environments, Staging and Production**, each with its own database and deployment, sharing nothing at runtime. The admin is the source of truth, and each catalog item carries a draft state plus explicit publish targets. An item published only to Staging can never reach Production by construction, not by a filter. Reason: safe experimentation and a real end-to-end staging storefront.
4. **No deny or exclusion rules in the catalog.** Compatibility is expressed only as per-model allow-lists (which fabrics, options, and upgrades a given piece offers). Reason: simpler to reason about and to maintain.
5. **Fabrics, options, and add-on upgrades are standalone reusable objects**, each with image and description, selected per model. Upgrades carry a price and an optional placement. Reason: define once, reuse everywhere, configure per piece.
6. **Server-authoritative pricing.** Reason: correctness and tamper resistance.
7. **The fit estimator runs on the server, behind a modular, clearly located, swappable seam** (stable interface plus pluggable adapter), with a rule-based default and shirt and trouser modules at launch. Reason: it is the most safety-critical subsystem, the browser is untrusted, future machine-learning and photo or scan methods need the server, and the cost on Cloudflare is tiny. If the estimate call ever fails, detailed manual entry still works.
8. **Shipping is owned in the admin** (zones, methods, prices), computed by CUTURA, and attached to the draft order as a custom shipping line. Reason: lower coupling than configuring shipping in Shopify, and full control.
9. **One supplier at launch, modeled as an entity ready for many**, all orders routed to the default. Reason: matches reality now, anticipates leather and suit suppliers later.
10. **Manual approval gate.** Every order waits in review and is forwarded to the tailor by email only after the founder approves it in the admin. The flow is invisible to the customer. Automated auto-forward of plausible orders is a later toggle. Reason: quality control at launch, automation once trusted.
11. **Remake-first fit guarantee with a money-back fallback, customer keeps the original at launch.** A remake is a fresh production run (nothing returns to Vietnam) using the stored measurement snapshot plus the adjustment. Refund runs through Shopify; at launch it does not require returning the item. Bounded to the first order per garment type, once, within a window, reviewed by the founder. Reason: fits the two hard constraints (no return to Vietnam, no Swiss alteration tailor yet) while meeting customer expectations.
12. **VAT is invisible to the customer and the displayed price is all-inclusive** (standard shipping and VAT included). The displayed price is always the price paid. The only exception is an optional paid express shipping method, added later. When VAT registration applies, VAT is extracted from inside the existing price (the displayed price stays constant), and Shopify computes and records it on the draft order.
13. **One measurement profile per user**, transient for guests (entered at order time, stored only if the customer registers), using the three-layer model and versioning. Each garment type reads the fields it needs; missing fields are entered or estimated and added to the profile. A per-piece advanced override can adjust specific fields by a few millimetres for that garment only, hidden behind an optional control, and never changes the profile. Effective values are frozen into the immutable order snapshot at purchase.
14. **Multi-item orders ship together in one parcel.** Each garment has its own production package, status, and QC; shipping releases only once every item has passed QC. Reason: Vietnam shipping is long and costly.
15. **Inventory has three independent controls plus global pauses.** Publish state, fabric availability (set manually from tailor communication), and a product orderable or view-only flag (a view-only product stays visible with ordering disabled), plus a global capacity cap and a vacation or pause mode with a calm configurable message.
16. **Languages: German, English, Italian, French.** German is default and fallback. URLs are locale-prefixed. The site auto-detects the visitor's browser language and remembers the chosen language on the order (always) and the account (when registered), driving emails and the printed parcel card. Spanish is deferred.
17. **Sewn-in label is language-neutral** (fibre composition plus international care symbols, one standard label). The localized care and thank-you text lives on the parcel card produced at the Swiss packaging step, not sewn into the garment.
18. **Personalized recommendations are staged.** A content-based and curated baseline at launch using owned data, a modular swappable recommendation seam, consented signal capture from the start, and a full machine-learning personalization model later. Body measurements are used only for fit relevance inside CUTURA's boundary, never for cross-customer profiling; broader behavioural profiling is consent-gated; personalization data is deleted with the customer.
19. **No saved payment methods.** Reason: keep the compliance surface small.
20. **Quality and agent guard rails are foundational** (E15): layered tests that verify against a running environment, a deploy smoke test, CI as the merge and deploy gate, a definition of done that requires real evidence, a UI and UX checklist, and a small set of specialized review agents.

---

## 5. Glossary (domain objects)

- **Garment Type:** a category (shirt, trouser, and later jacket, suit) that references a measurement schema, a supplier-spec template, and a QC template. Data, not code.
- **Base Model:** a sellable product under a garment type (for example an Oxford business shirt), with base price, media, lead time, and the fabrics, options, and upgrades it allows.
- **Fabric:** a standalone reusable material with code, image, description, fibre composition, care data, surcharge, availability, supplier reference, and filter attributes.
- **Option Group and Option Value:** a configurable choice (collar, cuff, fit) and its values, each with image, description, and surcharge, scoped per garment type and selected per model.
- **Add-on Upgrade:** an optional priced extra (for example an additional pocket), possibly several per garment, each with image, description, price, and an optional placement.
- **Collection:** a curated, ordered group of models with handle, localized name, description, and banner.
- **Measurement Profile:** a customer's body measurements in three layers (entered, derived, confirmed), versioned. One per user, transient for guests.
- **Measurement Schema:** the set of measurement fields, units, and plausible ranges for a garment type. Data.
- **Estimator:** the per-garment-type component that derives additional measurements from a core subset, behind a swappable interface.
- **Production Package:** the immutable, complete specification of one garment for production, generated when an order is paid.
- **Order Snapshot:** the frozen configuration, upgrades, and confirmed measurements captured at purchase, never altered afterwards.
- **Status and Status Machine:** the lifecycle states of an order and the guarded transitions between them.
- **QC Record:** the result of the Swiss quality check for a garment, with checklist outcome, photos, and a pass, fail, or override decision.
- **Fit Review:** a customer request after delivery reporting a fit problem, with reason and photos, leading to a remake, alteration reimbursement (later), or refund.
- **Fit Feedback:** structured post-delivery feedback that feeds estimator improvement.
- **Supplier:** the tailor entity (contact, capabilities, notes) to which production packages are routed.
- **Environment and Publish Target:** Staging or Production; an item is published independently to each.

---

## 6. Explicit non-goals (out of scope, by decision)

- Shopify-managed catalog, metaobjects, metafields, or collections.
- Catalog deny or exclusion rules (allow-lists only).
- Automatic body scan or photo measurement at launch (future, gated by consent, deletion, and DPIA).
- Saved payment methods or storing card data.
- Multi-currency and markets beyond Switzerland and Liechtenstein at launch.
- Returns shipped back to Vietnam.
- A shipping line shown to the customer for standard delivery (it is included in the price).
- Subscriptions.
- A separate rewritten business plan (the existing plan stands).

---

## 7. Epic map

| Epic | Title |
|---|---|
| E1 | Catalog and Garment-Type Platform |
| E2 | Catalog Admin and Merchandising Tools |
| E3 | Storefront, Discovery and Content |
| E4 | Configurator |
| E5 | Measurement System |
| E6 | Customer Accounts and Self-Service |
| E7 | Cart, Checkout, Pricing and Payments |
| E8 | Order Orchestration, Production and QC |
| E9 | Notifications and Communications |
| E10 | Operations and Backoffice |
| E11 | Recommendations, Personalization and AI |
| E12 | Internationalization and Localization |
| E13 | Compliance, Privacy, Trust and Legal |
| E14 | Growth, Marketing and Future Commerce |
| E15 | Development Workflow and Quality Harness |
| E16 | Platform and Non-Functional Requirements |

---

# E1. Catalog and Garment-Type Platform

**Goal:** Own all sellable structure as data. Garment types, models, fabrics, options, upgrades, collections, prices, attributes, media, and per-model allow-lists live in CUTURA's database and are read by the storefront through CUTURA's API. The model is garment-type-agnostic so new categories are added as data.

### US-1.1 Garment types as data
As the platform owner, I want garment types defined as data, each with its own option model, measurement schema, supplier-spec template, and QC template, so that new categories can be added without code changes.
**Acceptance:**
- Creating a base model requires assigning exactly one garment type.
- A new garment type plus its referenced schemas and templates functions end to end with no deploy.
- At launch only shirt and trouser are populated.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-101 | Model `GarmentType` as a first-class catalog entity. | Must | Launch |
| FR-102 | Every base model belongs to exactly one garment type. | Must | Launch |
| FR-103 | A garment type references a measurement schema, a supplier-spec template, and a QC template by ID. | Must | Launch |
| FR-104 | Adding a garment type and its data requires no code change or migration. | Must | Launch |

### US-1.2 Base models
As the founder, I want base models under a garment type with base price, media, lead-time range, and the fabrics, options, and upgrades they allow, so that each model has its own product page and configurator.
**Acceptance:**
- A base model carries name, garment type, description, base price, media set, lead-time min and max, publish state, and localized content.
- Publishing is blocked with a clear message if no allowed fabrics or required choices are defined.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-110 | Model `BaseModel` with the fields above. | Must | Launch |
| FR-111 | A base model declares its allowed fabrics, option groups, and upgrades. | Must | Launch |
| FR-112 | A base model carries localized display content. | Must | Launch |

### US-1.3 Standalone reusable fabrics
As the founder, I want fabrics as standalone reusable objects (code, name, image, description, fibre composition, care data, surcharge, availability, supplier, attributes) attachable to many models, so that I manage each fabric once.
**Acceptance:**
- A fabric has a unique stable code and all fields above.
- An unavailable fabric is not selectable in the configurator.
- Fibre composition and care data are present and usable on the product page and in the supplier spec.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-120 | Model `Fabric` as a reusable entity with a unique stable code. | Must | Launch |
| FR-121 | A fabric carries fibre composition and care data. | Must | Launch |
| FR-122 | A fabric carries availability, surcharge, supplier reference, images, and filter attributes. | Must | Launch |
| FR-123 | A fabric can be associated with many models and garment types. | Must | Launch |

### US-1.4 Standalone reusable options
As the founder, I want option groups and values (collar, cuff, fit, colour, shape) as standalone reusable objects with image, description, and surcharge, assignable per model, so that the configurator is fully data-driven.
**Acceptance:**
- An option group has a label and values; a value has code, display name, visual representation, and surcharge.
- Per model, an option group can be required or optional.
- Options are scoped per garment type so irrelevant options never appear on unrelated models.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-130 | Model `OptionGroup` and `OptionValue` with visual representation and surcharge. | Must | Launch |
| FR-131 | Assign option groups to a model as required or optional. | Must | Launch |
| FR-132 | Scope options per garment type. | Must | Launch |

### US-1.5 Add-on upgrades
As the founder, I want add-on upgrades as optional priced extras (for example an additional pocket), with image, description, price, and an optional placement, multiple allowed per garment, configured per model, so that customers can enrich a piece and the tailor receives precise instructions.
**Acceptance:**
- An upgrade has name, image, description, price, and an optional placement value.
- A model can offer several upgrades, and the customer can add more than one.
- Selected upgrades, with placement and price, flow into the order snapshot and the supplier spec.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-140 | Model `Upgrade` with price and optional placement. | Must | Launch |
| FR-141 | Upgrades are multi-select per garment. | Must | Launch |
| FR-142 | Upgrades carry image and description. | Must | Launch |
| FR-143 | Upgrades are assigned per model. | Must | Launch |

### US-1.6 Server-authoritative pricing
As the platform owner, I want the configured price computed on the server from catalog data (base plus fabric plus options plus upgrades), so that prices are always correct and tamper proof.
**Acceptance:**
- A configuration returns a server-computed price with an itemized breakdown.
- A client-supplied price is never trusted; the server recomputes at add-to-cart and at checkout.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-150 | Compute configured price server-side from catalog components. | Must | Launch |
| FR-151 | Never trust a client price; recompute at cart and checkout. | Must | Launch |
| FR-152 | Expose an itemized price breakdown for display and the snapshot. | Must | Launch |

### US-1.7 Collections
As the founder, I want collections as data with handle, localized name and description, banner, and ordered members, so that I curate the storefront like a Shopify store but without code.
**Acceptance:**
- A collection has the fields above and an ordered member list.
- No collection handle is hardcoded in application logic.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-160 | Model `Collection` with handle, localized content, banner, and ordered members. | Must | Launch |
| FR-161 | No collection handle hardcoded in code. | Must | Launch |

### US-1.8 Media in object storage
As the founder, I want catalog images stored in R2 and referenced by entities, so that media is optimized, CDN-delivered, and degrades gracefully.
**Acceptance:**
- Model, fabric, option, and upgrade images are stored in R2 and referenced by stable keys.
- Missing media degrades gracefully with no broken-image artifacts.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-170 | Store catalog media in R2, referenced from entities. | Must | Launch |
| FR-171 | Deliver media optimized and CDN-cached. | Must | Launch |
| FR-172 | Degrade gracefully on missing media. | Should | Launch |

### US-1.9 Catalog localization
As the platform owner, I want catalog display content localizable in German, English, Italian, and French in CUTURA's own database, so that the storefront serves localized content without a third-party layer.
**Acceptance:**
- Each user-facing field supports per-locale values; German is default.
- A missing translation falls back to German rather than empty content.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-180 | Store localized catalog content (DE, EN, IT, FR) in own DB. | Must | Launch |
| FR-181 | Apply a defined locale fallback (German) when a translation is missing. | Should | Launch |

### US-1.10 Draft state and publish targets
As the founder, I want every catalog entity to have a draft state and explicit publish targets, so that editing never goes live until I publish it to a chosen environment.
**Acceptance:**
- Entities can be Draft, Published to Staging, and Published to Production, independently.
- Drafts appear on no storefront.
- An item published only to Staging never appears on Production, enforced structurally.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-190 | Support draft state plus per-environment publish targets on all catalog entities. | Must | Launch |
| FR-191 | A storefront serves only entities published to that environment. | Must | Launch |
| FR-192 | Staging-only items can never reach Production. | Must | Launch |

### US-1.11 Filterable structured attributes
As the platform owner, I want catalog items to carry structured attributes (colour family, occasion, fit, fabric weight), so that smart discovery and recommendations are data-driven and controllable.
**Acceptance:**
- Models and fabrics carry a defined set of structured attributes.
- Attributes power filtering and sorting in the storefront.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1A0 | Define structured, filterable attributes on models and fabrics. | Must | Launch |
| FR-1A1 | Attributes are usable by discovery and recommendations. | Must | Launch |

### US-1.12 Availability and orderability controls
As the founder, I want three independent controls (publish state, fabric availability, product orderable or view-only), so that I can manage what is sellable precisely.
**Acceptance:**
- Fabric availability is a manual flag I set from tailor communication.
- A product can be set view-only: visible on the storefront with ordering disabled.
- These combine with the global capacity and vacation pause.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1B0 | Fabric availability flag set manually. | Must | Launch |
| FR-1B1 | Product orderable or view-only flag, independent of publish state. | Must | Launch |
| FR-1B2 | View-only products show with ordering disabled, not removed. | Must | Launch |

### US-1.13 Fabric and option lifecycle
As the founder, I want to retire a fabric or option cleanly, so that it disappears from new configurations while existing orders and historical snapshots remain intact.
**Acceptance:**
- Retiring an item removes it from new configuration without altering past orders or snapshots.
- Historical orders still render their original fabric and options.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1C0 | Support retiring catalog items without breaking historical references. | Must | Launch |

### US-1.14 Price-change safety
As the platform owner, I want price changes to never alter historical orders, and in-progress carts to be recomputed at checkout, so that no customer is charged a stale or wrong price.
**Acceptance:**
- A price change does not change any completed order's recorded price.
- An open cart recomputes against current prices at checkout.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1D0 | Historical order prices are immutable. | Must | Launch |
| FR-1D1 | Carts recompute price at checkout. | Must | Launch |

---

# E2. Catalog Admin and Merchandising Tools

**Goal:** A founder-facing, no-code tool to manage everything in E1 plus shipping, suppliers, capacity, attributes, collections, and cross-sell rules. This replaces the Shopify-admin-plus-code-sync workflow.

### US-2.1 No-code catalog management
As the founder, I want to create and edit all catalog entities in a UI, so that adding a model, fabric, option, upgrade, or collection never needs code or a deploy.
**Acceptance:**
- Full create, read, update, delete for all catalog entity types.
- A saved and published change appears in the storefront with no deploy.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-201 | Full CRUD for all catalog entities. | Must | Launch |
| FR-202 | Changes take effect without a deploy. | Must | Launch |

### US-2.2 Image upload
As the founder, I want to upload images in the admin and attach them to entities, so that I manage media without external tools.
**Acceptance:**
- Uploaded images are stored in R2 and immediately attachable.
- I can set a primary image and order additional images.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-210 | Upload images to R2 and attach to entities. | Must | Launch |
| FR-211 | Set a primary image and order images. | Should | Launch |

### US-2.3 Pricing management
As the founder, I want to set base prices, option surcharges, and upgrade prices in the admin, so that server pricing reflects my pricing without code.
**Acceptance:**
- All price components are editable.
- A changed surcharge applies to newly configured prices after publish.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-220 | Edit base prices and all surcharge and upgrade prices. | Must | Launch |

### US-2.4 Upgrades and allow-lists
As the founder, I want to configure add-on upgrades (price, placement) and the per-model allowed fabrics, options, and upgrades, so that each piece offers exactly what I choose.
**Acceptance:**
- I manage upgrades per model with price and optional placement.
- I manage allow-lists per model. There are no deny rules.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-230 | Manage upgrades per model. | Must | Launch |
| FR-231 | Manage per-model allow-lists for fabrics, options, and upgrades. | Must | Launch |

### US-2.5 Publish controls
As the founder, I want to publish to Staging or Production and unpublish, so that I control exactly what is live in each environment.
**Acceptance:**
- I can publish an entity to Staging, to Production, or both, and unpublish.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-240 | Publish to Staging or Production and unpublish, per entity. | Must | Launch |

### US-2.6 View-only and availability controls
As the founder, I want to set a product view-only and toggle fabric availability, so that I can stop ordering for pieces or fabrics I cannot currently produce.
**Acceptance:**
- A view-only toggle disables ordering while keeping the product visible.
- A fabric availability toggle removes it from new configuration.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-250 | Toggle product view-only and fabric availability in the admin. | Must | Launch |

### US-2.7 Admin auth and audit trail
As the platform owner, I want the admin protected by authentication separate from customers, with every change recorded, so that only authorized staff edit and changes are traceable.
**Acceptance:**
- Admin access requires authentication separate from customer auth.
- Every change records actor, entity, change, and timestamp.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-260 | Admin authentication separate from customer accounts. | Must | Launch |
| FR-261 | Audit trail of all admin changes. | Must | Launch |

### US-2.8 Localized content management
As the founder, I want to enter German, English, Italian, and French content in the admin, so that localized content is maintained in one place.
**Acceptance:**
- I can enter values per locale for each localizable field.
- The admin shows which locales are incomplete.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-270 | Edit localized content per locale. | Must | Launch |
| FR-271 | Surface incomplete locales. | Should | Launch |

### US-2.9 Preview drafts
As the founder, I want to preview drafts before publishing, so that I verify configuration and media without exposing them.
**Acceptance:**
- I can preview a draft entity in an authenticated context.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-280 | Authenticated preview of draft entities. | Should | Launch |

### US-2.10 Shipping configuration
As the founder, I want to configure shipping zones, methods, and prices in the admin, so that I own shipping and it feeds the checkout.
**Acceptance:**
- I define shipping for Switzerland and Liechtenstein, with standard shipping included in the displayed price.
- The model supports an additional paid express method for later.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-290 | Manage shipping zones, methods, and prices in the admin. | Must | Launch |
| FR-291 | Support a paid express method as an additional option. | Could | Future |

### US-2.11 Supplier management
As the founder, I want to manage the supplier entity (contact, capabilities, notes), so that the model is ready for more suppliers while routing all orders to the default now.
**Acceptance:**
- I can manage one supplier and its details.
- The data model supports several suppliers and per-garment-type routing later.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-2A0 | Model and manage `Supplier` as an entity. | Must | Launch |
| FR-2A1 | Route all production packages to the default supplier at launch. | Must | Launch |
| FR-2A2 | Support multiple suppliers and routing rules. | Could | Future |

### US-2.12 Capacity and pause controls
As the founder, I want to set a capacity cap and a vacation or pause mode with a configurable, calm message, so that I protect quality and delivery and never overwhelm the tailor.
**Acceptance:**
- When open orders reach the cap, new orders pause and the storefront shows the configured message.
- A vacation mode can be scheduled, sharing the same pause mechanism.
- The default message is generic and reassuring.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-2B0 | Set a capacity cap that pauses new orders when reached. | Must | Launch |
| FR-2B1 | Schedule a vacation or pause mode with a configurable message. | Must | Launch |
| FR-2B2 | Provide a calm default pause message. | Must | Launch |

### US-2.13 Attribute and filter management
As the founder, I want to manage the structured attributes on items, so that discovery filters reflect how customers think.
**Acceptance:**
- I assign attribute values (colour family, occasion, fit, fabric weight) to models and fabrics.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-2C0 | Manage structured attributes on catalog items. | Must | Launch |

### US-2.14 Collection management
As the founder, I want to manage collections like a Shopify store (name, banner, description, ordered members), so that I curate merchandising.
**Acceptance:**
- I create and order collection members and set banner and localized content.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-2D0 | Manage collections including banner, content, and member order. | Must | Launch |
| FR-2D1 | Automated rule-based collections. | Could | Future |

### US-2.15 Cross-sell rule management
As the founder, I want to define curated cross-sell rules (for example, with this shirt suggest these trousers), so that I lift revenue without behavioural complexity at launch.
**Acceptance:**
- I create rules mapping a model or attribute to suggested items.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-2E0 | Manage curated cross-sell rules. | Should | Launch |

---

# E3. Storefront, Discovery and Content

**Goal:** A public storefront that reads CUTURA's own catalog, helps customers find pieces the way they think, presents the brand with trust, and works on every device in four languages.

### US-3.1 Homepage
As a visitor, I want a homepage with a clear value proposition, hero, trust signals, and entry points, so that I understand CUTURA and where to start.
**Acceptance:**
- Responsive homepage with value proposition, hero, trust signals, and collection entries.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-301 | Responsive homepage with value proposition, hero, trust signals, and entries. | Must | Launch |

### US-3.2 Browse collections
As a shopper, I want to browse collections from the catalog, so that I can find models.
**Acceptance:**
- Collections render from the catalog in the configured order.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-310 | Render collections from the catalog with ordered members. | Must | Launch |

### US-3.3 Product page
As a shopper, I want a product page with media, description, lead time, the all-inclusive price, the configurator, and fibre composition, so that I can evaluate and configure a piece.
**Acceptance:**
- The PDP shows media, description, lead-time range, all-inclusive price, configurator entry, and fibre composition.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-320 | PDP with media, description, lead time, all-inclusive price, and configurator. | Must | Launch |
| FR-321 | Show fibre composition on the PDP. | Must | Launch |

### US-3.4 Smart discovery
As a shopper, I want to filter and sort by what I actually think in (garment type, fabric, colour, fit, price, occasion, what is orderable now), so that I quickly find pieces that suit me.
**Acceptance:**
- Filtering and sorting use the structured attributes.
- Available and orderable pieces are surfaced clearly; view-only items are marked.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-330 | Filter and sort by structured, customer-centric attributes. | Should | Launch |
| FR-331 | Reflect orderability and availability in discovery. | Should | Launch |

### US-3.5 Occasion browsing
As a shopper, I want to browse by occasion or need (office, wedding guest, weekend), so that I shop the way I think about an outfit.
**Acceptance:**
- Occasion-based navigation uses the occasion attribute.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-340 | Provide occasion or use-case browsing. | Should | Launch |

### US-3.6 Global search
As a shopper, I want to search models, fabrics, and content, so that I jump straight to what I want.
**Acceptance:**
- Localized search across catalog and content.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-350 | Localized global search across catalog and content. | Should | Launch |

### US-3.7 Calm unavailable treatment
As a shopper, I want a view-only or unavailable item to read calmly with an option to be notified, so that it does not feel broken.
**Acceptance:**
- A quiet currently-unavailable label, no error or price-pressure tone.
- A notify-me hook is available.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-360 | Calm unavailable treatment for view-only items. | Must | Launch |
| FR-361 | Notify-me hook on unavailable items. | Should | Launch |

### US-3.8 Content and legal pages
As a visitor, I want maintainable content and legal pages, so that I can learn about the brand and its terms.
**Acceptance:**
- Content pages (About, Process, FAQ) and legal pages (Terms, Privacy, Imprint, Shipping, Fit Guarantee) are editable.
- Navigation is hardcoded at launch and becomes editable later.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-370 | Editable content pages. | Must | Launch |
| FR-371 | Editable legal pages. | Must | Launch |
| FR-372 | Editable navigation menu. | Could | Future |

### US-3.9 Cross-device
As a shopper, I want consistent behaviour on phone, tablet, and desktop, so that I can shop on any device.
**Acceptance:**
- Mobile-first responsive layout across breakpoints, configurator and wizard included.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-380 | Mobile-first responsive storefront across devices. | Must | Launch |

### US-3.10 Trust and brand content
As a shopper, I want trust-building content (fabric closeups, craftsmanship and QC story, realistic delivery guidance), so that I feel confident ordering made-to-measure online.
**Acceptance:**
- Trust assets are present on relevant pages.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-390 | Provide trust and brand content assets. | Should | Launch |
| FR-391 | Lookbook or journal content. | Could | Future |

### US-3.11 Fit and size guide
As a shopper, I want a clear fit and size guide, so that I measure correctly and choose the right fit.
**Acceptance:**
- A fit and size guide content asset is available and linked from the measurement flow.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-3A0 | Provide a fit and size guide. | Should | Launch |

### US-3.12 Configuration sharing
As a shopper, I want to share a summary or link of a configured piece, so that I can get a second opinion before buying.
**Acceptance:**
- A configured piece can be shared as a link or summary.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-3B0 | Share a configured piece as a link or summary. | Could | Post-launch |

### US-3.13 Recently viewed and related
As a shopper, I want to see recently viewed and related products, so that I can return to pieces and discover similar ones.
**Acceptance:**
- Recently viewed and related items are shown where relevant.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-3C0 | Show recently viewed and related products. | Could | Post-launch |

### US-3.14 Designed empty and error states
As a shopper, I want clear states for unusual situations (unavailable fabric, payment failed, capacity reached, estimator unavailable), so that I am never confused by a broken-looking page.
**Acceptance:**
- Empty and error states are designed, not default, for the key flows.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-3D0 | Provide designed empty and error states for key flows. | Should | Launch |

---

# E4. Configurator

**Goal:** A data-driven configurator with real-time, server-authoritative pricing, allow-list-driven choices, add-on upgrades, required-field validation, and a fast low-friction path.

### US-4.1 Choose fabric and options
As a shopper, I want to choose a fabric and style options and see the result, so that I can personalize my garment.
**Acceptance:**
- Option groups, values, and fabrics render from the catalog.
- Selecting a fabric or option updates the preview (swatch or image change).

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-401 | Render fabrics and options from the catalog. | Must | Launch |
| FR-402 | Visual change per fabric and option. | Must | Launch |

### US-4.2 Add upgrades
As a shopper, I want to add optional upgrades with their placement and see the price change, so that I can enrich my garment.
**Acceptance:**
- I can add one or more upgrades, each with placement where applicable.
- The price updates to reflect upgrades.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-403 | Add upgrades (with placement) in the configurator. | Must | Launch |
| FR-404 | Upgrades are reflected in the price. | Must | Launch |

### US-4.3 Live price
As a shopper, I want the price to update live as I change choices, so that I always see the current total.
**Acceptance:**
- The price updates live from the server-computed breakdown.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-410 | Live price updates from the server-computed price. | Must | Launch |

### US-4.4 Server-side price validation
As the platform owner, I want price computed and validated server-side, so that the displayed and charged price is always correct.
**Acceptance:**
- The server recomputes before add-to-cart and never trusts a client price.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-411 | Recompute price server-side before add-to-cart. | Must | Launch |
| FR-412 | Never trust a client-supplied price. | Must | Launch |

### US-4.5 Allow-list-driven choices
As a shopper, I want to see only the fabrics, options, and upgrades allowed for that model, so that I cannot build something unavailable.
**Acceptance:**
- The configurator shows only the per-model allow-listed choices. There is no separate deny enforcement.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-420 | Present only per-model allow-listed fabrics, options, and upgrades. | Must | Launch |

### US-4.6 Required choices and gating
As a shopper, I want to see which choices are required before I can add to cart, so that I know what is missing.
**Acceptance:**
- Required versus optional is shown.
- Add-to-cart is blocked until required choices and a valid measurement profile are present.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-430 | Show required versus optional choices. | Must | Launch |
| FR-431 | Block add-to-cart until required choices and a valid measurement profile exist. | Must | Launch |

### US-4.7 Configuration carried through
As a shopper, I want my exact configuration carried into cart and order, so that what I see is what gets made.
**Acceptance:**
- Configuration and upgrades are captured and reproducibly displayed in cart and order.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-440 | Capture and reproducibly display configuration and upgrades in cart and order. | Must | Launch |

### US-4.8 Save and resume
As a registered customer, I want to save a configuration and resume later, so that I do not lose work.
**Acceptance:**
- A logged-in customer can save and resume a configuration. Draft recovery is gentle, not aggressive.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-450 | Save and resume configuration for logged-in users. | Should | Post-launch |

### US-4.9 Low-friction fast path
As a shopper, I want a fast path from product to paid with sensible defaults and the quick measurement method up front, so that I can order in as few steps as possible.
**Acceptance:**
- Sensible defaults are preselected so a decisive buyer can proceed quickly.
- Deep configuration and the per-piece override are available but never block the fast path.
- The number of steps and required fields on the happy path stays within an agreed budget (asserted in E15).

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-460 | Provide a fast, low-friction path from product to checkout with sensible defaults. | Must | Launch |
| FR-461 | Keep deep options non-blocking on the fast path. | Must | Launch |

---

# E5. Measurement System

**Goal:** Capture measurements simply and safely, derive missing values with a swappable per-garment-type estimator, keep the customer in control, and protect the data. This epic re-homes the ported three-layer model, versioning, and outlier gate.

### US-5.1 Measurement schema per garment type
As the platform owner, I want each garment type to define its own measurement schema (fields, units, plausible ranges), so that each garment captures the right measurements and a new type adds its schema as data.
**Acceptance:**
- A garment type has a data-defined measurement schema.
- Shirt and trouser schemas are populated at launch.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-501 | Define a measurement schema per garment type as data. | Must | Launch |
| FR-502 | Populate shirt and trouser schemas at launch. | Must | Launch |

### US-5.2 Detailed manual entry
As a shopper, I want to enter all required measurements manually, so that I can provide precise values.
**Acceptance:**
- Detailed entry captures all schema-required fields with validation.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-510 | Detailed entry captures all schema-required fields with validation. | Must | Launch |

### US-5.3 Quick wizard
As a shopper, I want a short guided wizard that takes a few high-information measurements (such as height and weight plus a few more) and derives the rest, so that I can order quickly.
**Acceptance:**
- The quick wizard captures a core subset and derives the remaining values via the garment-type estimator.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-520 | Quick wizard derives remaining measurements via the estimator. | Must | Launch |

### US-5.4 Server-side modular estimator
As the platform owner, I want the estimator to run on the server behind a clearly located, swappable interface with a pluggable adapter, so that I can replace or outsource the estimation model later without a rewrite.
**Acceptance:**
- Estimation runs server-side.
- The estimator is a stable interface with per-garment-type modules and a pluggable adapter.
- A rule-based default plus shirt and trouser modules ship at launch.
- The estimation location in the code is clearly named and documented.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-521 | Run estimation server-side. | Must | Launch |
| FR-522 | Expose a stable estimator interface with a pluggable adapter. | Must | Launch |
| FR-523 | Provide a rule-based default and shirt and trouser modules at launch. | Must | Launch |
| FR-524 | Document the estimator seam so the model can be replaced. | Must | Launch |

### US-5.5 Transparent derived values
As a shopper, I want derived values shown clearly, editable, and explicitly confirmed by me, so that I stay in control.
**Acceptance:**
- Derived values are visible, editable, and require explicit confirmation.
- Original, derived, and confirmed values are stored separately.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-530 | Show derived values, allow editing, and require explicit confirmation. | Must | Launch |
| FR-531 | Store original, derived, and confirmed values separately. | Must | Launch |

### US-5.6 Profile versioning
As the platform owner, I want each profile change versioned, so that it stays traceable which values produced an order.
**Acceptance:**
- Every change creates a new version; prior versions are retained.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-540 | Version every profile change and retain prior versions. | Must | Launch |

### US-5.7 Plausibility and outlier detection
As the platform owner, I want plausibility and outlier detection (the automated makes-sense check), so that implausible or incomplete measurements are flagged.
**Acceptance:**
- Plausibility and outlier checks run on measurements.
- Missing confirmed values or implausible combinations are flagged.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-550 | Run plausibility and outlier checks on measurements. | Must | Launch |
| FR-551 | Flag missing confirmed values and implausible combinations. | Must | Launch |

### US-5.8 Review on flag
As operations, I want flagged measurements to route the order to internal review before production, so that risky orders get a human check.
**Acceptance:**
- A flagged order is routed to review before it can be released to production.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-560 | Route flagged orders to review before production release. | Must | Launch |

### US-5.9 No silent change
As the platform owner, I want confirmed measurements to never change silently, so that they only change via an explicit versioned update.
**Acceptance:**
- Confirmed measurements never change without an explicit, versioned action.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-570 | Never change confirmed measurements silently. | Must | Launch |

### US-5.10 One profile per user
As a customer, I want one measurement profile that I can build once and reuse, and as a guest I want to enter measurements and order without an account, so that ordering is simple and reordering is easy.
**Acceptance:**
- One profile per registered user; transient for guests (not stored unless they register).
- Each garment type reads the fields it needs; missing fields are entered or estimated and added to the profile.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-580 | One measurement profile per user, transient for guests. | Must | Launch |
| FR-581 | A garment type reads the fields it needs and adds missing ones to the profile. | Must | Launch |

### US-5.11 Per-piece advanced override
As a shopper, I want an optional advanced control to adjust specific measurements by a few millimetres for one garment only, so that I can fine-tune fit without changing my profile or being overwhelmed.
**Acceptance:**
- A per-piece override adjusts specific fields for that garment only.
- It never changes the profile and stays hidden behind an optional control.
- The effective values (profile plus overrides) are frozen into the order snapshot.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-590 | Provide a per-piece measurement override that does not change the profile. | Must | Launch |
| FR-591 | Keep the override hidden behind an optional advanced control. | Must | Launch |
| FR-592 | Freeze effective values into the order snapshot. | Must | Launch |

### US-5.12 Measurement guidance and help
As a shopper, I want clear instructions, diagrams, and tips while measuring, plus an easy way to ask for help, so that I measure correctly.
**Acceptance:**
- The wizard provides instructions, diagrams, and tips.
- An easy path to contact support exists, with a hook for video or photo help later.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-5A0 | Provide measurement instructions, diagrams, and tips. | Should | Launch |
| FR-5A1 | Provide a help escalation path from the wizard. | Should | Launch |

### US-5.13 Unit switch
As a shopper, I want centimetres by default and the option to switch to inches in settings, so that I use units I am comfortable with.
**Acceptance:**
- Centimetres by default, switchable to inches in settings.
- Measurements are stored canonically in one unit and displayed in the chosen one.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-5B0 | Default to centimetres with an inches switch in settings. | Must | Launch |
| FR-5B1 | Store measurements canonically and convert for display. | Must | Launch |

### US-5.14 Multiple named profiles
As a registered customer, I want several named profiles (myself, household members, distinct saved fits), so that I can reuse them.
**Acceptance:**
- A customer can maintain multiple named profiles.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-5C0 | Support multiple named profiles per customer. | Could | Future |

### US-5.15 Photo-assisted measurement
As a shopper, I want to add a photo that helps estimate my measurements, so that the fit is better, and as the platform owner I want this gated by consent, deletion, and a DPIA.
**Acceptance:**
- A photo-assisted method plugs into the estimator seam.
- It is gated by explicit consent, a deletion concept, and a DPIA, and uses the sensitive-data regime.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-5D0 | Photo-assisted measurement method behind the estimator seam, consent-gated. | Could | Future |

### US-5.16 Scan-based measurement
As a shopper, I want a photo or 3D scan that extracts my measurements automatically, so that measuring is effortless, and as the platform owner I want it gated and safe.
**Acceptance:**
- A scan method plugs into the estimator seam, gated by consent, deletion, and a DPIA, with explicit confirmation before ordering.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-5E0 | Scan-based measurement method behind the estimator seam, consent-gated. | Could | Future |

---

# E6. Customer Accounts and Self-Service

**Goal:** Own customer accounts with profiles, orders, reorder, fit requests, data rights, and guest tracking. The auth mechanism is an architecture decision; these stories are independent of it.

### US-6.1 Guest purchase
As a shopper, I want to buy as a guest, so that I can order with minimal friction.
**Acceptance:**
- Purchase is possible without an account.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-601 | Allow purchase as a guest. | Must | Launch |

### US-6.2 Account and login
As a shopper, I want to create an account and log in, so that I can save measurements and see orders.
**Acceptance:**
- Own account registration and login, data minimal and compliant.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-610 | Own account registration and login (mechanism per architecture phase). | Must | Launch |
| FR-611 | Account auth is data minimal and compliant. | Must | Launch |

### US-6.3 Account recovery
As a customer, I want to recover access if I lose it, so that I am never locked out.
**Acceptance:**
- A recovery path exists (password reset or magic-link resend, per the chosen mechanism).

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-620 | Provide an account recovery path. | Must | Launch |

### US-6.4 Manage profile
As a registered customer, I want to view, rename, archive, and reuse my measurement profile, so that I can reorder easily.
**Acceptance:**
- Profile management with ownership strictly enforced (only own profile).

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-630 | Manage the measurement profile. | Must | Launch |
| FR-631 | Enforce profile ownership. | Must | Launch |

### US-6.5 Order history
As a registered customer, I want to see my order history, statuses, and configuration summaries, so that I can track and reference orders.
**Acceptance:**
- Order history with status and configuration summary.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-640 | Show order history with status and configuration summary. | Must | Launch |

### US-6.6 Address management
As a registered customer, I want to manage addresses and a default shipping address, so that checkout is faster.
**Acceptance:**
- Address management for Switzerland and Liechtenstein with a default.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-650 | Address management with a default shipping address. | Should | Launch |

### US-6.7 Guest tracking and claiming
As a guest, I want a tokenized order-status link in my emails, and if I later register with the same email I want my past orders attached, so that I can track and consolidate orders.
**Acceptance:**
- Guests receive a tokenized status link.
- Registering with the same email attaches prior guest orders.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-660 | Provide tokenized guest order tracking. | Must | Launch |
| FR-661 | Attach prior guest orders on registration with the same email. | Should | Launch |

### US-6.8 Data deletion
As a customer, I want to request deletion of my data, so that I can exercise my right to erasure.
**Acceptance:**
- Customer-initiated deletion covers all personal data across all tables (profiles, orders subject to legal retention, fit feedback, personalization data).

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-670 | Customer-initiated deletion. | Must | Launch |
| FR-671 | Deletion covers all personal data across all tables. | Must | Launch |

### US-6.9 Data access and export
As a customer, I want to access and export my data, so that I can exercise my right to information.
**Acceptance:**
- A customer can view and export their data.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-680 | Provide customer data access and export. | Should | Launch |

### US-6.10 One-click reorder
As a returning customer, I want to reorder from a past order and choose whether to keep the size as ordered, update it to my latest profile data, or override specific fields, so that repeat purchases are easy and accurate.
**Acceptance:**
- Reorder offers three paths: keep as ordered, update to latest profile, or per-field override (add or subtract).
- The chosen values are frozen into the new order snapshot.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-690 | One-click reorder with keep, update, or override of measurements. | Should | Launch |

### US-6.11 Fit review and remake request
As a customer, I want to request a fit review or remake from an order with a reason and photos, so that I can use the fit guarantee.
**Acceptance:**
- A fit-review request from an order captures a reason and photos within the window.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-6A0 | Submit a fit-review or remake request with reason and photos. | Must | Launch |

### US-6.12 Post-delivery fit feedback
As a customer, I want to submit detailed fit feedback after delivery, with only a minimal subset required, so that I help improve future fit without friction.
**Acceptance:**
- A detailed feedback form with few mandatory fields.
- Feedback is captured as data that feeds the estimator.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-6B0 | Provide a detailed fit-feedback form with few mandatory fields. | Should | Launch |

### US-6.13 Order status timeline
As a customer, I want a visual order status timeline (received, in production, quality check, on its way), so that I am reassured during the long lead time.
**Acceptance:**
- A clear status timeline in the account and the tracking link.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-6C0 | Provide a customer-facing order status timeline. | Should | Launch |

### US-6.14 Wishlist and favorites
As a shopper, I want to save models or fabrics, so that I can return to them.
**Acceptance:**
- A wishlist or favorites function exists.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-6D0 | Provide wishlist or favorites. | Could | Future |

### US-6.15 Notify-me
As a shopper, I want to be notified when a view-only item or an unavailable fabric becomes available, so that I can order it when it returns.
**Acceptance:**
- A notify-me request and a notification when availability returns.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-6E0 | Provide notify-me for unavailable items and fabrics. | Should | Post-launch |

---

# E7. Cart, Checkout, Pricing and Payments

**Goal:** Carry the full configuration to checkout, present an all-inclusive price with VAT shielded, create a Shopify Draft Order with a price override and a custom shipping line, take Swiss payment methods, and keep the customer experience simple and honest.

### US-7.1 Cart carries configuration
As a shopper, I want my configuration, upgrades, and chosen measurement profile carried into the cart, so that the cart reflects exactly what I will order.
**Acceptance:**
- The cart carries the full configuration, upgrades, and measurement reference, with a reproducible summary and an itemized price.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-701 | Cart carries configuration, upgrades, and measurement reference. | Must | Launch |
| FR-702 | Cart shows a reproducible summary and itemized price. | Must | Launch |

### US-7.2 All-inclusive pricing
As a shopper, I want the displayed price to be the price I pay, including standard shipping and VAT, so that there are no surprises at checkout.
**Acceptance:**
- The displayed price includes standard shipping and VAT.
- No shipping line is shown to the customer for standard delivery.
- An optional paid express method is the only case where an extra cost appears (future).

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-710 | Display an all-inclusive price including standard shipping and VAT. | Must | Launch |
| FR-711 | Show no standard shipping line to the customer. | Must | Launch |

### US-7.3 VAT shielded
As the platform owner, I want VAT handled correctly but invisible to the customer, so that the experience stays simple and compliant.
**Acceptance:**
- The customer never makes a VAT choice or sees VAT math in the storefront.
- Admin prices are entered gross; Shopify computes and records VAT on the draft order by extracting it from the gross price.
- When VAT registration applies, the displayed price stays constant (VAT is extracted from inside).
- VAT appears only on the confirmation and on a proper VAT invoice once registered.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-720 | Keep VAT invisible to the customer in the storefront. | Must | Launch |
| FR-721 | Enter prices gross; Shopify extracts and records VAT (tax-inclusive). | Must | Launch |
| FR-722 | Keep the displayed price constant when VAT registration applies. | Must | Launch |

### US-7.4 Draft order creation
As a shopper, I want to pay through a secure checkout for my custom-priced item, so that I can complete the purchase.
**Acceptance:**
- The backend creates a Shopify Draft Order with a custom line item, the configured price override, configuration and measurement reference as properties, and a custom shipping line.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-730 | Create a Draft Order with a price override and config and measurement properties. | Must | Launch |
| FR-731 | Attach the custom shipping line to the draft order. | Must | Launch |

### US-7.5 Hosted checkout
As a shopper, I want to reach the Shopify-hosted checkout to pay, so that payment is secure.
**Acceptance:**
- The customer is taken to the hosted checkout to pay.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-740 | Redirect to the Shopify-hosted checkout. | Must | Launch |

### US-7.6 Swiss payment methods
As a Swiss shopper, I want to pay with the methods I use (TWINT, cards, wallets), in CHF, so that payment is familiar.
**Acceptance:**
- CHF as primary currency.
- All major Swiss methods through Shopify Payments, TWINT included, plus cards and common wallets.
- Exact method and TWINT availability are verified in the checkout live test.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-750 | Support CHF and the major Swiss payment methods including TWINT. | Must | Launch |
| FR-751 | Verify payment methods and TWINT on the draft checkout (live test). | Must | Launch |

### US-7.7 Reliable paid status
As the platform owner, I want paid status returned reliably with reconciliation, so that orders only proceed when actually paid.
**Acceptance:**
- Paid status is confirmed via webhook.
- A reconciliation against Shopify catches any missed event.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-760 | Confirm paid status via webhook. | Must | Launch |
| FR-761 | Reconcile orders against Shopify as the source of truth. | Should | Launch |

### US-7.8 Lead-time expectations
As a shopper, I want a clear made-to-order lead time before I pay, so that I know when to expect my garment.
**Acceptance:**
- Lead time and made-to-order expectations are communicated before purchase.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-770 | Communicate lead time and made-to-order expectations before purchase. | Must | Launch |

### US-7.9 Pre-checkout validation
As the platform owner, I want validation before checkout (complete configuration, valid measurement, accepted Terms and Privacy with version capture), so that incomplete or non-consented orders cannot proceed.
**Acceptance:**
- Checkout is blocked unless configuration and measurement are valid and Terms and Privacy are accepted.
- The accepted Terms and Privacy version is recorded.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-780 | Validate configuration, measurement, and accepted Terms and Privacy before checkout. | Must | Launch |
| FR-781 | Record the accepted Terms and Privacy version on the order. | Must | Launch |

### US-7.10 Order confirmation
As a shopper, I want an order confirmation after payment, so that I know it worked.
**Acceptance:**
- A clear order confirmation email is triggered after a successful order.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-790 | Trigger an order confirmation email after a successful order. | Must | Launch |

### US-7.11 Discounts
As a shopper, I want to apply a discount or promo code, so that I can use an offer.
**Acceptance:**
- A discount or promo code is applied on the draft order (line or order level).

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-7A0 | Apply discount or promo codes on the draft order. | Should | Launch |

### US-7.12 Refunds
As the platform owner, I want refunds handled through Shopify, so that money movement stays on the payment rail.
**Acceptance:**
- Refunds are issued through Shopify and reflected in the order status.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-7B0 | Issue refunds through Shopify. | Must | Launch |

### US-7.13 Cancellation before approval
As a customer, I want to cancel for a full refund any time before the order is approved, so that I can change my mind while nothing is in production.
**Acceptance:**
- A customer can cancel for a full Shopify refund before the order is approved.
- After approval or in production, cancellation is not available and the fit guarantee covers fit issues.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-7C0 | Allow customer cancellation with full refund before approval. | Should | Launch |

### US-7.14 Multi-item cart and order
As a shopper, I want to order several garments together, so that I can buy more than one piece at once.
**Acceptance:**
- The cart and order hold several garments (see E8 for per-garment production and combined shipping).

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-7D0 | Support several garments in a cart and order. | Must | Launch |

### US-7.15 Express shipping
As a shopper, I want an optional faster shipping method, so that I can receive my order sooner for an added cost.
**Acceptance:**
- An optional paid express method is offered and added to the draft order as a separate shipping line.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-7E0 | Offer an optional paid express shipping method. | Could | Future |

### US-7.16 Shipping restriction
As the platform owner, I want shipping restricted to Switzerland and Liechtenstein, so that I only sell where I am ready.
**Acceptance:**
- Addresses outside Switzerland and Liechtenstein are blocked before payment.
- Browsing language and shipping country are independent.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-7F0 | Restrict shipping to Switzerland and Liechtenstein. | Must | Launch |
| FR-7F1 | Block out-of-region addresses before payment. | Must | Launch |

### US-7.17 Optional phone
As the platform owner, I want to optionally collect a phone number used only for order issues, so that I can reach a customer when something goes wrong.
**Acceptance:**
- Phone is optional at checkout and used only for order-related contact.
- Swiss and Liechtenstein postal codes and address format are validated.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-7G0 | Optionally collect a phone number for order issues only. | Should | Launch |
| FR-7G1 | Validate Swiss and Liechtenstein postal codes and address format. | Should | Launch |

### US-7.18 No stored payment data
As the platform owner, I want no saved payment methods, so that the compliance surface stays small.
**Acceptance:**
- No card or payment data is stored by CUTURA.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-7H0 | Do not store payment methods or card data. | Must | Launch |

### US-7.19 Draft checkout constraints
As the platform owner, I want draft-checkout limits handled, so that the primary checkout behaves acceptably.
**Acceptance:**
- Invoice link expiry is handled, and the absence of native abandoned-cart recovery is documented and mitigated.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-7I0 | Handle draft-order link expiry and document cart-recovery limits. | Should | Launch |

### US-7.20 Price safety at checkout
As the platform owner, I want carts recomputed at checkout, so that no one is charged a stale price.
**Acceptance:**
- The price is recomputed at checkout from current catalog data.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-7J0 | Recompute price at checkout. | Must | Launch |

---

# E8. Order Orchestration, Production and QC

**Goal:** Turn a paid order into an immutable production package, run a guarded status workflow with a manual approval gate, send the tailor a complete spec with images, quality-check in Switzerland, ship multi-item orders together, and handle remakes and the fit guarantee. This epic re-homes the ported status machine, QC workflow, and supplier spec.

### US-8.1 Idempotent ingestion
As the platform owner, I want paid orders ingested exactly once via a signed webhook, so that no order is lost or duplicated.
**Acceptance:**
- The paid webhook is HMAC-verified and idempotent (unique payment event ID).
- A production package is generated on paid.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-801 | Verify and idempotently process the paid webhook. | Must | Launch |
| FR-802 | Generate a production package on paid. | Must | Launch |

### US-8.2 Immutable snapshot
As operations, I want each garment frozen as an immutable snapshot, so that production uses the exact ordered specification.
**Acceptance:**
- The snapshot captures model, fabric code, configuration, upgrades with placement and price, confirmed measurements, notes, delivery target, and internal notes.
- The snapshot is unchangeable after creation.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-810 | Capture a complete immutable order snapshot per garment. | Must | Launch |
| FR-811 | Make the snapshot unchangeable after creation. | Must | Launch |

### US-8.3 Guarded status machine
As operations, I want orders to move through defined statuses with guarded transitions, so that the workflow is consistent and auditable.
**Acceptance:**
- States: new, in_review, approved, in_production, arrived_ch, qc_passed, qc_failed, awaiting_customer_info, shipped, problem.
- Only allowed transitions are possible; every change is audited.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-820 | Implement the status set above. | Must | Launch |
| FR-821 | Allow only valid transitions. | Must | Launch |
| FR-822 | Audit every status change. | Must | Launch |

### US-8.4 Manual approval gate
As the founder, I want every order to wait for my approval in the admin, after which it is forwarded to the tailor by email, with the customer never seeing this step, so that I control quality at launch.
**Acceptance:**
- An approve action moves in_review to approved and triggers the supplier email.
- All orders require approval at launch; the outlier flag marks orders for scrutiny but does not bypass approval.
- The approval step is invisible to the customer.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-830 | Approve action moves in_review to approved and triggers the supplier email. | Must | Launch |
| FR-831 | Require approval for all orders at launch. | Must | Launch |

### US-8.5 Hold and flag
As operations, I want to hold or flag an order before production, so that risky orders are resolved first.
**Acceptance:**
- An order can be held or flagged for manual clarification before release.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-840 | Hold or flag an order before production release. | Must | Launch |

### US-8.6 Multi-item production and shipping
As operations, I want each garment in an order to have its own production package, status, and QC, with the order shown as a rolled-up status and shipped together, so that production is precise and shipping is efficient.
**Acceptance:**
- Each garment is a separate production package with its own status and QC.
- The order shows a rolled-up status and waits on its slowest item.
- Shipping releases only once every item has passed QC; the parcel ships together.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-850 | One production package, status, and QC per garment. | Must | Launch |
| FR-851 | Roll up garment statuses into an order status. | Must | Launch |
| FR-852 | Release shipping only after all items pass QC; ship together. | Must | Launch |

### US-8.7 Supplier spec, email, and PDF
As operations, I want a standardized supplier specification, email, and PDF per garment type, with images, so that the tailor receives complete, consistent instructions.
**Acceptance:**
- The spec is generated from the per-garment-type template.
- A Workers-compatible PDF embeds the model image, fabric image and code, option images and descriptions, upgrade images with placement and price, and all measurements.
- The spec and PDF are sent to the tailor on approval, grouping items going to the same tailor.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-860 | Generate the supplier spec from the garment-type template. | Must | Launch |
| FR-861 | Generate a Workers-compatible PDF embedding all images and the full spec. | Must | Launch |
| FR-862 | Send the spec and PDF to the supplier on approval, grouped per tailor. | Must | Launch |

### US-8.8 QC checklist
As QC, I want a checklist appropriate to the garment type at goods-in, so that I verify quality consistently.
**Acceptance:**
- A QC checklist per garment type, with results, photos, and notes on deviations.
- Recorded fails are never silently dropped; a failed item cannot become qc_passed.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-870 | Provide a QC checklist per garment type. | Must | Launch |
| FR-871 | Record results, photos, and notes on deviations. | Should | Launch |
| FR-872 | Never silently drop fails; block a failed item from passing. | Must | Launch |

### US-8.9 Photo capture at QC
As QC, I want to attach photos of the finished garment to the order, so that there is a record for QC, support, and disputes.
**Acceptance:**
- Photos can be attached to the order at QC.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-880 | Attach finished-garment photos to the order at QC. | Should | Launch |

### US-8.10 Shipping gate
As operations, I want shipping released only after QC pass or an explicit override, so that nothing ships unchecked.
**Acceptance:**
- Shipping requires qc_passed or an override; override is only from qc_failed and is audited.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-890 | Require qc_passed or override before shipping. | Must | Launch |
| FR-891 | Allow override only from qc_failed, audited. | Must | Launch |

### US-8.11 Remake and fit guarantee
As the platform owner, I want remake-first fit handling with a refund fallback and the customer keeping the original, so that fit issues are resolved without returns to Vietnam and without a Swiss tailor.
**Acceptance:**
- A free remake on the first order per garment type, reported within 30 days with photos, reviewed by the founder, produced from the original snapshot plus the adjustment.
- A refund through Shopify if the customer prefers or a remake still fails; at launch the customer keeps the original.
- Bounded: first order per garment type, once, within the window.
- Hooks exist for later alteration reimbursement and for requiring a domestic return.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-8A0 | Review a fit request and decide remake, refund, or (later) alteration. | Must | Launch |
| FR-8A1 | Create a remake as a linked package from the original snapshot. | Must | Launch |
| FR-8A2 | Issue a refund through Shopify; customer keeps the original at launch. | Must | Launch |
| FR-8A3 | Bound the guarantee to the first order per garment type, once, within the window. | Must | Launch |

### US-8.12 Fit feedback as data
As the platform owner, I want fit-review reasons and post-delivery feedback captured as structured data, so that the estimator improves over time.
**Acceptance:**
- Fit reasons and feedback are stored as structured data linked to the order and the estimator improvement dataset.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-8B0 | Capture structured fit reasons and feedback feeding the estimator. | Should | Launch |

### US-8.13 Exception handling
As operations, I want a clear path for the awaiting_customer_info and problem states, so that stuck orders are resolved and resumed.
**Acceptance:**
- A defined process to contact the customer, capture the response, and resume or close the order.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-8C0 | Provide a process for awaiting_customer_info and problem states. | Must | Launch |

### US-8.14 Inbound batch tracking
As operations, I want to track the arrival of incoming batches from Vietnam, so that I see what is arriving and what is awaiting QC.
**Acceptance:**
- Inbound batches and their QC status are visible.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-8D0 | Track inbound batches and their QC throughput. | Should | Launch |

### US-8.15 Packaging and unboxing
As operations, I want a defined packaging step that adds the localized parcel card and care guidance, so that the unboxing reinforces the brand.
**Acceptance:**
- The packaging step prints and adds the parcel card in the order's language and the care guidance before shipping.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-8E0 | Define a packaging step that adds the localized parcel card and care guidance. | Should | Launch |

### US-8.16 Automated auto-forward
As the founder, I want a toggle so that plausible orders auto-forward to the tailor and only questionable ones go to review, so that I reduce manual work once I trust the checks.
**Acceptance:**
- A toggle enables auto-forward for orders that pass the plausibility check; failures route to review.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-8F0 | Provide an auto-forward toggle gated by the plausibility check. | Could | Future |

### US-8.17 Alteration reimbursement
As the founder, I want to reimburse a local Swiss tailor for minor alterations once I have a partner, so that small fit issues are fixed cheaply.
**Acceptance:**
- Alteration reimbursement is available as a fit-review outcome with a capped amount on proof.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-8G0 | Support alteration reimbursement as a fit-review outcome. | Could | Future |

### US-8.18 Resale of returned items
As the founder, I want returned garments listed as reduced-price ready-to-ship stock, so that I recover value if I later accept physical returns.
**Acceptance:**
- Returned items can be listed as reduced-price stock (reuses the stock-product capability).

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-8H0 | List returned items as reduced-price ready-to-ship stock. | Could | Future |

---

# E9. Notifications and Communications

**Goal:** Keep customers, the tailor, and the founder informed in the right language, with a provider abstraction and proper deliverability.

### US-9.1 Order confirmation
As a customer, I want an order confirmation email with my configuration summary, so that I have a record.
**Acceptance:** A branded confirmation with the configuration summary is sent after a successful order.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-901 | Send a branded order confirmation with configuration summary. | Must | Launch |

### US-9.2 Customer status emails
As a customer, I want proactive status emails, so that I am kept informed.
**Acceptance:** Emails for at least shipped, qc_failed, and awaiting_customer_info.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-910 | Send customer status emails (shipped, QC issue, awaiting info). | Must | Launch |

### US-9.3 Supplier production email
As operations, I want the tailor to receive the production package with PDF and images on approval, so that production can start.
**Acceptance:** The supplier email with PDF and images is sent on approval.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-920 | Send the supplier production email with PDF and images on approval. | Must | Launch |

### US-9.4 Localized emails and card
As a customer, I want emails and the parcel card in my language, so that communication matches my experience.
**Acceptance:** Transactional emails and the parcel card use the order's stored language.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-930 | Localize transactional emails and the parcel card to the order's language. | Must | Launch |

### US-9.5 Provider abstraction
As the platform owner, I want the email provider behind an abstraction, so that I can choose or switch provider (Resend or Cloudflare Email).
**Acceptance:** Email sending goes through a provider interface.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-940 | Send email through a provider interface. | Must | Launch |

### US-9.6 Admin notifications
As the founder, I want email alerts for new orders, orders needing review, and QC due, so that I act promptly.
**Acceptance:** Admin email alerts for new order, needs review, and QC due.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-950 | Send admin notifications for new order, needs review, and QC due. | Should | Launch |

### US-9.7 Reorder reminder
As a customer, I want a gentle reorder reminder after a sensible delay, so that I can reorder when it makes sense.
**Acceptance:** A reorder reminder email is sent after a configured delay.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-960 | Send a reorder reminder email after a delay. | Should | Post-launch |

### US-9.8 Remake and refund emails
As a customer, I want status emails for remakes and refunds, so that I know what is happening.
**Acceptance:** Customer updates for remake progress and refunds.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-970 | Send remake and refund status emails. | Should | Launch |

### US-9.9 Lifecycle emails
As a customer, I want a welcome and a post-purchase care email, so that I feel looked after.
**Acceptance:** Welcome and post-purchase care emails are sent at the right moments.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-980 | Send welcome and post-purchase care emails. | Should | Post-launch |

### US-9.10 Win-back
As the brand, I want a win-back email to lapsed customers, so that I re-engage them.
**Acceptance:** A win-back email targets lapsed customers.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-990 | Send win-back emails to lapsed customers. | Could | Future |

### US-9.11 Marketing email
As the brand, I want marketing email with double opt-in and one-click unsubscribe, so that it is lawful and respectful; transactional email stays exempt.
**Acceptance:** Marketing email uses double opt-in and unsubscribe; transactional email is separate.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-9A0 | Provide marketing email with double opt-in and unsubscribe. | Could | Post-launch |

### US-9.12 Communication log
As support, I want every email to a customer recorded on the order, so that I have continuity.
**Acceptance:** Sent emails are logged on the order.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-9B0 | Log customer communications on the order. | Should | Launch |

### US-9.13 Deliverability
As the platform owner, I want SPF, DKIM, and DMARC set up on the sending domain, so that emails are delivered.
**Acceptance:** SPF, DKIM, and DMARC are configured.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-9C0 | Configure SPF, DKIM, and DMARC for the sending domain. | Must | Launch |

---

# E10. Operations and Backoffice

**Goal:** Run fulfillment from one admin: a status board, approval, the review and outlier queue, customer and supplier views, the communication log, metrics, and cost capture.

### US-10.1 Order list and detail
As operations, I want to filter, search, and act on orders, so that I can run fulfillment.
**Acceptance:** An order list with filter and search, and an order detail with status actions.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1001 | Provide an order list with filter and search. | Must | Launch |
| FR-1002 | Provide an order detail with status actions. | Must | Launch |

### US-10.2 Pipeline board
As the founder, I want a board grouped by status with a review and outlier lane and an awaiting-customer-info lane, so that I see at a glance what came in, what needs checking, what is paid, in production, back, not good, needs contact, and shipped.
**Acceptance:** A status-grouped board with the review and outlier lane and the awaiting-customer-info lane.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1010 | Provide a status-grouped pipeline board with review, outlier, and awaiting-info lanes. | Must | Launch |

### US-10.3 Approve and forward
As the founder, I want an approve action on an order that forwards it to the tailor, so that I gate production.
**Acceptance:** The approve action triggers the supplier email (see E8).

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1011 | Approve action triggers the supplier email. | Must | Launch |

### US-10.4 Outlier surfacing
As the founder, I want outlier and review orders surfaced clearly, so that I check risky measurements.
**Acceptance:** Outlier warnings actually display in the admin (a known past bug to avoid).

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1020 | Surface outlier and review orders with warnings that display. | Must | Launch |

### US-10.5 Fit-review queue
As the founder, I want a queue of fit-review and remake requests, so that I handle them promptly.
**Acceptance:** A queue lists fit-review requests with reason and photos.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1030 | Provide a fit-review and remake queue. | Must | Launch |

### US-10.6 Roles
As the platform owner, I want role-based access (Founder/Admin, Operations/QC, Support, Content/Marketing), so that people access only what they need.
**Acceptance:** Role-based access with at least those roles.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1040 | Provide role-based access with at least those roles. | Should | Post-launch |

### US-10.7 Audit log
As the platform owner, I want operational and sensitive-data actions logged, so that I have traceability.
**Acceptance:** An audit log covers status changes, admin operations, and sensitive data access.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1050 | Maintain an audit log of status changes, admin operations, and sensitive access. | Must | Launch |

### US-10.8 Pre-release correction
As support, I want to correct an unclear order before release with an auditable record, so that mistakes are fixable and traceable.
**Acceptance:** A pre-release correction is recorded in the audit log.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1060 | Allow audited pre-release order corrections. | Should | Launch |

### US-10.9 Customer management
As support, I want to view a customer, their orders, profile, and fit history, so that I can help them.
**Acceptance:** A customer view shows orders, profile, and fit history.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1070 | Provide a customer view with orders, profile, and fit history. | Should | Launch |

### US-10.10 Notes and tags
As support, I want internal notes and tags on orders and customers, so that I keep continuity.
**Acceptance:** Internal notes and tags on orders and customers.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1080 | Provide internal notes and tags on orders and customers. | Should | Launch |

### US-10.11 KPI dashboard
As the founder, I want a dashboard of my soft-launch KPIs, so that the launch produces real learning.
**Acceptance:** A dashboard shows orders, revenue, measurement-completion rate, review and outlier rate, remake rate, actual lead time, margin per order, and reorder rate.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1090 | Provide a soft-launch KPI dashboard. | Should | Launch |

### US-10.12 Cost and margin
As the founder, I want optional cost fields per order (fabric, production, inbound, fees), so that I can see margin per order.
**Acceptance:** Cost fields are stored per order and margin can be viewed.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-10A0 | Capture optional cost fields per order and compute margin. | Should | Post-launch |

### US-10.13 Supplier performance
As the founder, I want to track defect rate and lead-time adherence per supplier, so that I de-risk the single supplier and prepare routing.
**Acceptance:** Supplier defect rate and lead-time adherence are tracked.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-10B0 | Track supplier defect rate and lead-time adherence. | Could | Post-launch |

### US-10.14 Export
As the founder, I want to export orders and data as CSV, so that I can do accounting.
**Acceptance:** Orders and data can be exported as CSV.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-10C0 | Export orders and data as CSV. | Should | Launch |

### US-10.15 Capacity-aware lead times
As the founder, I want communicated lead times to extend automatically as I near the capacity cap, so that promises stay honest.
**Acceptance:** Lead times extend automatically near the capacity cap.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-10D0 | Extend communicated lead times automatically near capacity. | Should | Launch |

---

# E11. Recommendations, Personalization and AI

**Goal:** Help customers find pieces they will like using owned data, behind a swappable seam, building toward a state-of-the-art system while staying private and honest about what is possible at launch.

### US-11.1 Baseline recommendations
As a shopper, I want relevant suggestions based on what is known about me and the catalog, so that I discover pieces I am likely to want.
**Acceptance:**
- A content-based and curated baseline uses catalog attributes, my profile and past orders, my in-session browsing and configuration, fit outcomes, and reorder behaviour.
- Suggestions appear on the home page, product pages, cart, post-purchase, and the account.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1101 | Provide content-based and curated recommendations from owned data. | Should | Launch |
| FR-1102 | Surface recommendations on home, product, cart, post-purchase, and account. | Should | Launch |

### US-11.2 Cross-sell
As a shopper, I want tasteful related suggestions (for example trousers after a shirt), so that I can complete an outfit.
**Acceptance:** Curated cross-sell rules drive tasteful suggestions on product, cart, and post-purchase.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1110 | Drive cross-sell from curated rules, tastefully placed. | Should | Launch |

### US-11.3 Signal capture
As the platform owner, I want to capture the consented signals a recommender needs from the start, so that a later model has real training data.
**Acceptance:** Consented interaction signals are captured per the analytics taxonomy.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1120 | Capture consented recommendation signals from the start. | Should | Launch |

### US-11.4 Modular recommendation seam
As the platform owner, I want a clearly located, swappable recommendation interface, so that a machine-learning model can replace the baseline without a rewrite.
**Acceptance:** A stable interface with the baseline behind it and a pluggable adapter.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1130 | Provide a swappable recommendation interface. | Should | Launch |

### US-11.5 Personalization privacy
As the platform owner, I want personalization to respect privacy, so that it is lawful and trustworthy.
**Acceptance:**
- Launch personalization uses purpose-clear data (profile, orders, current session).
- Broader cross-session behavioural profiling is consent-gated under the consent banner.
- Body measurements are used only for fit relevance inside CUTURA's boundary, never for cross-customer profiling.
- Personalization data is removed when a customer is deleted.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1140 | Use purpose-clear data at launch and consent-gate broader profiling. | Must | Launch |
| FR-1141 | Use measurements only for fit relevance, never cross-customer profiling. | Must | Launch |
| FR-1142 | Delete personalization data with the customer. | Must | Launch |

### US-11.6 Machine-learning personalization
As the platform owner, I want a state-of-the-art personalization model once there is volume, so that recommendations get materially better.
**Acceptance:** A machine-learning model plugs into the recommendation seam, using the captured consented signals.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1150 | Provide machine-learning personalization behind the seam. | Could | Future |

### US-11.7 AI virtual try-on
As a shopper, I want an approximate visualization of my configured garment on a photo of myself, so that I can judge the look before ordering.
**Acceptance:**
- A personal photo is used only with explicit consent.
- The output is clearly labelled approximate and not a fit promise.
- Images use the sensitive-data regime (encryption, strict retention, deletion) and pass content safety; images are never reused without consent.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1160 | Provide AI virtual try-on, consent-gated and clearly labelled approximate. | Could | Future |
| FR-1161 | Apply the sensitive-data regime and content safety to try-on images. | Could | Future |

### US-11.8 Prompt-to-bespoke
As a shopper, I want to describe a unique piece and learn whether the tailor can make it, so that I can order something one of a kind.
**Acceptance:**
- A structured custom-request intake (description, optional reference image, garment type).
- Content guardrails block infringing, inappropriate, or clearly impossible requests.
- A feasibility review where the founder or tailor accepts, rejects, or quotes, with price and lead time shown before payment.
- An approved request converts into a normal order and production package, with a clear subject-to-confirmation status. Reuses the review, approval, and supplier-spec machinery.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1170 | Provide a prompt-to-bespoke intake with content guardrails. | Could | Future |
| FR-1171 | Gate prompt-to-bespoke behind a feasibility review and pre-payment quote. | Could | Future |
| FR-1172 | Convert an approved bespoke request into a normal order and production package. | Could | Future |

---

# E12. Internationalization and Localization

**Goal:** Serve four languages cleanly, detect and remember the customer's language, and carry it to emails and the parcel, while shipping only to Switzerland and Liechtenstein.

### US-12.1 Four locales
As a visitor, I want the site in German, English, Italian, or French, so that I can use it in my language.
**Acceptance:** Four locales with German as default and fallback.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1201 | Support German, English, Italian, and French. | Must | Launch |
| FR-1202 | Use German as default and fallback. | Must | Launch |

### US-12.2 Locale-prefixed URLs
As a visitor, I want locale-prefixed URLs, so that language is explicit and shareable.
**Acceptance:** URLs carry a locale prefix for all four languages.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1210 | Use locale-prefixed URLs for all four languages. | Must | Launch |

### US-12.3 Language detection
As a visitor, I want the site to open in my browser's language with a manual switch, so that I land in the right language without effort.
**Acceptance:** Auto-detect the browser language and open the matching locale; a manual switcher is available; German is the fallback.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1220 | Auto-detect browser language and open the matching locale. | Must | Launch |
| FR-1221 | Provide a manual language switcher. | Must | Launch |

### US-12.4 Language memory
As the platform owner, I want the chosen language remembered on the order (always) and the account (when registered), so that all communication is in the customer's language.
**Acceptance:** Language is stored on the order always and on the account when registered.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1230 | Store the language on the order always and the account when registered. | Must | Launch |

### US-12.5 Language to emails and parcel
As a customer, I want my emails and parcel card in my language, so that the whole experience matches.
**Acceptance:** Transactional emails and the printed parcel card use the stored order language (see E9.4 and E8.15).

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1240 | Drive emails and the parcel card from the stored order language. | Must | Launch |

### US-12.6 Reviewed translations
As the brand, I want professional, reviewed translations in all four languages, so that trust holds in every locale.
**Acceptance:** Visible copy is human-written or human-reviewed; raw machine output is not shipped.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1250 | Use reviewed, professional translations in all four locales. | Must | Launch |

### US-12.7 Localized formatting
As a visitor, I want dates, numbers, and CHF formatted correctly for my locale, so that content reads naturally.
**Acceptance:** Dates, numbers, and CHF are formatted per locale, with consistent rounding rules.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1260 | Apply localized date, number, and CHF formatting with defined rounding. | Should | Launch |

### US-12.8 Localized SEO
As the platform owner, I want hreflang and localized SEO, so that each language is discoverable.
**Acceptance:** hreflang and localized metadata are present for all four languages.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1270 | Provide hreflang and localized SEO metadata. | Must | Launch |

### US-12.9 Spanish
As the brand, I want Spanish added when relevant, so that I can reach Spanish-speaking customers later.
**Acceptance:** Spanish can be added as a fifth locale without a rebuild.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1280 | Support adding Spanish as a future locale. | Could | Future |

---

# E13. Compliance, Privacy, Trust and Legal

**Goal:** Be lawful and trustworthy in Switzerland: minimize and protect data, honor data rights, get VAT and labeling right, publish accurate policies, and back the made-to-measure promise.

### US-13.1 Data minimization
As the platform owner, I want to collect only data needed for ordering and fit, so that I minimize privacy exposure.
**Acceptance:** Only necessary personal data is collected, with a documented purpose per field.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1301 | Collect only necessary personal data, with a documented purpose per field. | Must | Launch |

### US-13.2 Measurement encryption
As the platform owner, I want body measurements protected at rest, so that a breach does not expose them in clear. Body measurements are treated as specially protected personal data under Swiss law.
**Acceptance:** Body-measurement data is encrypted at rest.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1310 | Encrypt body-measurement data at rest. | Must | Launch |

### US-13.3 Full deletion
As a customer, I want my data fully deletable, so that my erasure rights are honored.
**Acceptance:** Deletion covers all personal data across all tables (see E6.8); records kept only where legal or accounting retention applies, documented.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1320 | Provide full deletion across all tables, with documented legal exceptions. | Must | Launch |

### US-13.4 Data access and export
As a customer, I want to access and export my data, so that I can exercise my right to information.
**Acceptance:** Customer data access and export is available (see E6.9).

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1330 | Provide customer data access and export. | Should | Launch |

### US-13.5 Retention
As the platform owner, I want defined retention and lifecycle rules, so that data is not kept longer than needed.
**Acceptance:** Documented retention windows for measurements, orders, and logs, and a defined view of what deletion removes versus what is retained.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1340 | Define and document retention and lifecycle rules. | Should | Launch |

### US-13.6 Consent
As a visitor, I want clear consent for optional processing (analytics, pixels, broader profiling), so that processing is lawful and transparent.
**Acceptance:** A cookie and tracking consent banner gates analytics, pixels, and broader profiling.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1350 | Provide a consent banner gating analytics, pixels, and broader profiling. | Must | Launch |

### US-13.7 Accurate legal pages
As the platform owner, I want accurate, versioned, lawyer-reviewed legal pages, so that the brand is legally sound.
**Acceptance:**
- Real company data in legal pages.
- No fabricated citations or unverified claims (a past bug to avoid).
- Lawyer review before launch; pages are versioned.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1360 | Use real company data in legal pages. | Must | Launch |
| FR-1361 | No fabricated citations; lawyer review before launch. | Must | Launch |
| FR-1362 | Version legal pages. | Must | Launch |

### US-13.8 Terms version capture
As the platform owner, I want to record which Terms and Privacy version a customer accepted at order time, so that acceptance is traceable.
**Acceptance:** The accepted version is stored on the order (see E7.9).

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1370 | Record the accepted Terms and Privacy version on the order. | Must | Launch |

### US-13.9 VAT correctness
As the platform owner, I want VAT handled correctly and invisibly, with a proper VAT invoice once registered, so that I am compliant without burdening the customer.
**Acceptance:**
- VAT is computed and recorded correctly (via Shopify) and invisible in the storefront (see E7.3).
- A proper VAT invoice is available once registered.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1380 | Handle VAT correctly and invisibly. | Must | Launch |
| FR-1381 | Provide a VAT invoice once registered. | Should | Post-launch |

### US-13.10 Textile labeling
As the platform owner, I want fibre composition shown at the point of sale and on a sewn-in label, with care symbols, so that I meet textile labeling expectations.
**Acceptance:**
- Fibre composition is shown on the product page.
- The sewn-in label carries fibre composition and international care symbols, language-neutral, one standard label.
- Care text and the localized note are on the parcel card, not sewn in.
- The exact Swiss legal basis is confirmed with an advisor.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1390 | Show fibre composition on the product page. | Must | Launch |
| FR-1391 | Sewn-in label carries composition and care symbols, language-neutral. | Must | Launch |
| FR-1392 | Confirm the Swiss labeling basis with an advisor. | Should | Launch |

### US-13.11 Price-display compliance
As the platform owner, I want all-inclusive price display, so that I meet Swiss price-indication expectations.
**Acceptance:** The displayed price is the final consumer price including standard shipping and VAT (see E7.2).

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-13A0 | Display the final all-inclusive consumer price. | Must | Launch |

### US-13.12 Fit-guarantee policy
As a shopper, I want a clear published fit-guarantee policy, so that I trust ordering made-to-measure online.
**Acceptance:** The remake-first fit guarantee with refund fallback (keep original at launch) is published clearly.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-13B0 | Publish a clear fit-guarantee policy. | Must | Launch |

### US-13.13 AI feature guardrails
As the platform owner, I want guardrails for AI features, so that try-on and prompt-to-bespoke are safe and lawful.
**Acceptance:** Try-on image consent and privacy, and prompt content safety, are enforced (see E11.7 and E11.8).

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-13C0 | Enforce consent, privacy, and content safety for AI features. | Could | Future |

### US-13.14 Import and inbound finance
As the founder, I want import VAT and inbound finance handled with my advisor, so that imports are clean. This is a finance and process matter, not a customer feature.
**Acceptance:** Import VAT and inbound handling are defined with the advisor and reflected in cost capture.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-13D0 | Define import VAT and inbound finance handling with the advisor. | Should | Post-launch |

---

# E14. Growth, Marketing and Future Commerce

**Goal:** Capture the growth and future-commerce vision as proper stories with their hooks, so the foundation anticipates them. Most are Future; bundles are defined now at low priority.

### US-14.1 Packages and bundles
As a shopper, I want multi-item packs (for example two-shirt or three-shirt) with visible per-item savings, so that I buy more for better value.
**Acceptance:** Pack pricing is defined; at launch this can be covered by discount codes, with a real bundle experience later.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1401 | Provide package or bundle pricing. | Could | Post-launch |

### US-14.2 Referral
As a happy customer, I want to refer friends for a reward, so that I share the brand.
**Acceptance:** A referral mechanism rewards referrer and referee.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1410 | Provide a referral mechanism. | Could | Future |

### US-14.3 Gift cards
As a shopper, I want to buy a gift card, so that I can give CUTURA as a gift.
**Acceptance:** Gift cards can be purchased and redeemed.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1420 | Provide gift cards. | Could | Future |

### US-14.4 Gift flow
As a gift buyer, I want to send a piece to someone else with a gift message, so that the gift arrives well.
**Acceptance:** A gift flow supports a recipient address and a gift message.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1430 | Provide a gift flow with recipient address and message. | Could | Future |

### US-14.5 Loyalty
As a returning customer, I want to earn loyalty benefits, so that I am rewarded for staying.
**Acceptance:** A loyalty mechanism rewards repeat purchase.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1440 | Provide a loyalty mechanism. | Could | Future |

### US-14.6 B2B, corporate and wedding
As a business or wedding organizer, I want to order for several people with bulk pricing and invoice or purchase-order payment, so that I can outfit a group.
**Acceptance:** Multi-person orders, bulk pricing, and invoice or PO payment are supported, with the data model anticipating them.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1450 | Support multi-person orders for B2B, corporate, and wedding. | Could | Future |
| FR-1451 | Support bulk pricing and invoice or PO payment. | Could | Future |

### US-14.7 Reviews and ratings
As a shopper, I want verified-purchase reviews and ratings, so that I trust the product, and as the platform owner I want moderation.
**Acceptance:** Verified-purchase reviews with moderation are supported.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1460 | Provide verified-purchase reviews with moderation. | Could | Future |

### US-14.8 Lookbook and journal
As the brand, I want lookbook and journal or blog content, so that I build organic traffic and brand.
**Acceptance:** Lookbook and journal content is supported.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1470 | Provide lookbook and journal content. | Could | Future |

### US-14.9 Stock products and resale
As the founder, I want to sell ready-to-ship stock products, including resale of returned items at reduced price, so that I can offer accessories and recover value.
**Acceptance:** Plain stock products and resale of returns are supported (see E8.18).

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1480 | Support plain stock products and resale of returned items. | Could | Future |

### US-14.10 Automated collections
As the founder, I want rule-based collections, so that merchandising updates itself.
**Acceptance:** Automated collections build from rules (tag, price, type).

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1490 | Provide automated rule-based collections. | Could | Future |

### US-14.11 Multi-currency and markets
As the brand, I want additional markets and currencies, so that I can expand beyond Switzerland and Liechtenstein.
**Acceptance:** Additional markets, currencies, and shipping regions are supported without a rebuild.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-14A0 | Support additional markets and currencies. | Could | Future |

### US-14.12 Multi-supplier routing
As the founder, I want to route production to several suppliers by garment type, with backups, so that I scale beyond one tailor.
**Acceptance:** Production routes to several suppliers by rule, with backup support (see E2.11).

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-14B0 | Route production to several suppliers by rule, with backups. | Could | Future |

---

# E15. Development Workflow and Quality Harness

**Goal:** Keep quality high while building with coding agents, directly addressing the past failure mode where tests reported green while the app was broken. The principle is verification against reality, not self-reported success, with an outside-in view that catches the obvious, human-visible problems.

### US-15.1 Unit tests
As the team, I want unit tests for the domain logic that must never silently break, so that the core is protected.
**Acceptance:** Unit tests cover the estimator, the three-layer measurement model, the status machine and its transitions, pricing math (base plus fabric plus options plus upgrades, VAT extraction, all-inclusive total), and snapshot integrity.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1501 | Unit-test the estimator, measurement model, status machine, pricing math, and snapshots. | Must | Launch |

### US-15.2 Integration tests
As the team, I want integration tests for the seams that failed before, so that they stay correct.
**Acceptance:** Integration tests cover the idempotent paid webhook, draft-order price, shipping line and properties, supplier email and PDF generation with images, and D1 reads and writes.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1510 | Integration-test the webhook, draft order, supplier artifacts, and database. | Must | Launch |

### US-15.3 End-to-end tests
As the team, I want end-to-end tests of the real customer journeys on desktop and mobile against a running build, so that real flows are proven, not mocked.
**Acceptance:** E2E covers discover, configure, measure, checkout, and the admin approve-and-forward flow, on desktop and mobile, against a running build.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1520 | End-to-end test real journeys on desktop and mobile against a running build. | Must | Launch |

### US-15.4 Regression and deploy smoke test
As the team, I want regression tests and a deploy smoke test, so that fixed bugs and past failure classes cannot return and a broken deploy is caught immediately.
**Acceptance:**
- Every fixed bug and past failure class is locked by a test.
- A deploy smoke test fails loudly if the deployed app is not actually serving (the check that would have caught the worst past incident).

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1530 | Lock fixed bugs and failure classes with regression tests. | Must | Launch |
| FR-1531 | Run a deploy smoke test that fails if the app is not serving. | Must | Launch |

### US-15.5 Visual and UI sanity
As the team, I want pages rendered and screenshotted in CI and reviewed, so that layout breakage and awkward states are visible before customers see them.
**Acceptance:** Pages are rendered and screenshotted across breakpoints in CI, and a human or an agent reviews the rendered output rather than only asserting that code ran.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1540 | Render and screenshot pages in CI across breakpoints, with review. | Must | Launch |

### US-15.6 Definition of done
As the founder, I want a definition of done that an agent cannot mark complete without real evidence, so that green-without-proof cannot happen.
**Acceptance:** Done requires tests written and passing in CI, the change verified against a running environment, and the deploy smoke test green.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1550 | Enforce a definition of done requiring real CI and running-environment evidence. | Must | Launch |

### US-15.7 CI as gate
As the founder, I want CI to be the gate rather than an agent's word, so that nothing merges or deploys without passing.
**Acceptance:** Typecheck, lint, all test layers, build, and the smoke test must pass before merge or deploy.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1560 | Gate merge and deploy on typecheck, lint, tests, build, and smoke test. | Must | Launch |

### US-15.8 Living project conventions
As the team, I want project conventions captured as living context that agents read every time, so that growth does not erode the design.
**Acceptance:** A maintained conventions document captures architecture rules (Cloudflare-only, own catalog, allow-lists only, the modular estimator and recommendation seams), naming, where critical subsystems live, and what must never change silently (for example confirmed measurements).

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1570 | Maintain living project conventions read by agents. | Must | Launch |

### US-15.9 UI and UX checklist
As the founder, I want a UI and UX checklist enforced on every screen, so that the disconnected-field and awkward-layout problems do not recur.
**Acceptance:** Every screen is checked for no orphan or redundant fields, every input wired to real state and submission, labels and validation present, consistent components, and both mobile and desktop verified.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1580 | Enforce a UI and UX checklist on every screen. | Must | Launch |

### US-15.10 Staging-first and reversible
As the founder, I want every change proven on Staging before Production and reversible, so that releases are safe.
**Acceptance:** Changes are proven on Staging before promotion, and each release is rollback-able (fits the two-environment model).

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1590 | Prove changes on Staging before Production and keep releases reversible. | Must | Launch |

### US-15.11 Product and UX reviewer agent
As the founder, I want a product and UX reviewer agent that holds the customer and business perspective, so that friction and drift are caught.
**Acceptance:** The agent reviews changes and rendered pages, flags friction, awkward flows, redundant or confusing UI, and spec drift, and asks whether a real shopper would complete the task.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-15A0 | Provide a product and UX reviewer agent. | Should | Launch |

### US-15.12 QA and test-integrity agent
As the founder, I want a QA agent whose job is to distrust green, so that tests assert real behaviour.
**Acceptance:** The agent checks that tests assert real behaviour, that coverage exists for changed code, and that no test was weakened or skipped to pass.

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-15B0 | Provide a QA and test-integrity agent that distrusts green. | Should | Launch |

### US-15.13 Security and privacy review
As the founder, I want a lighter security and privacy review checklist given the sensitive measurement data, so that security is covered without overdoing agents.
**Acceptance:** A security and privacy checklist is applied (a checklist role rather than a full third agent, unless promoted later).

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-15C0 | Apply a security and privacy review checklist. | Should | Launch |

### US-15.14 Low-friction budget
As the founder, I want the happy-path step and field budget asserted in end-to-end tests, so that friction cannot creep back as the app grows.
**Acceptance:** The number of steps and required fields on the happy path stays at or below an agreed budget, asserted in E2E (see E4.9).

| FR | Requirement | Pri | Phase |
|---|---|---|---|
| FR-15D0 | Assert the happy-path step and field budget in end-to-end tests. | Should | Launch |

---

# E16. Platform and Non-Functional Requirements

**Goal:** The platform qualities that every feature depends on.

| NFR | Requirement | Pri |
|---|---|---|
| NFR-01 | Run entirely on Cloudflare (Workers, D1, KV, R2) plus Shopify (payment only) and an email provider. | Must |
| NFR-02 | Two fully isolated environments, Staging and Production, with separate databases and deployments, publish targets, and a promote-Staging-to-Production path. | Must |
| NFR-03 | Clear separation of storefront, catalog and commerce API, and operational and domain services, with the domain logic in a shared, tested module. | Must |
| NFR-04 | Automated CI/CD: build, lint, typecheck, tests, deploy, and rollback, resolving the prior deploy and billing issue from the old build. | Must |
| NFR-05 | Centralized error logging, monitoring, alerting, and correlation IDs. | Must |
| NFR-06 | KV-based rate limiting on public and authenticated endpoints. | Must |
| NFR-07 | Idempotent payment webhook, tolerant of retries, with reconciliation. | Must |
| NFR-08 | D1 backups and point-in-time recovery, a documented and tested restore, and a billing cap. | Must |
| NFR-09 | Timing-safe secret and HMAC comparisons, secret management with no secrets in the repo, least-privilege tokens, admin auth separated from customer auth, and session security. | Must |
| NFR-10 | Storefront server-rendered or equivalently indexable. | Must |
| NFR-11 | Mobile performance budgets with Lighthouse and Core Web Vitals checks in CI. | Must |
| NFR-12 | Accessibility target WCAG 2.2 AA, with the configurator and measurement wizard specifically covered for keyboard and screen-reader use. | Should |
| NFR-13 | Optimized, compressed, CDN-delivered media. | Must |
| NFR-14 | Graceful degradation if a service is down (for example, the estimator being unavailable still leaves detailed manual entry usable). | Should |
| NFR-15 | Tests for domain logic and guards against past failure classes, including the broken-deploy smoke test, no silently dropped QC fails, and comprehensive deletion. | Must |
| NFR-16 | Measurement data residency in Switzerland or the EU. | Must |
| NFR-17 | Maintenance mode and clean degradation if Shopify or email is briefly unavailable. | Should |
| NFR-18 | Bot and abuse protection on account, contact, and checkout forms. | Should |
| NFR-19 | Per-environment configuration and feature flags, so toggles (auto-forward, alteration reimbursement, photo method, express shipping) flip without code changes. | Should |
| NFR-20 | SEO infrastructure: sitemap, product structured data, and an admin-managed redirects table, with visible copy kept professional and never keyword-stuffed. | Should |

---

# Appendix A. Phasing summary

- **Launch (shirts and trousers):** the full E1 to E13 Must and Launch-marked stories, the E15 harness, and the E16 Must NFRs. This is the buyable, operable, compliant, trustworthy core with the quality foundation in place.
- **Post-launch:** the Should and Post-launch items (roles, KPI and cost detail, reorder reminders, lifecycle and marketing email, save and resume, notify-me, bundles, and similar), added once the first-customer loop is stable.
- **Future:** the full vision written as proper stories (AI try-on, prompt-to-bespoke, photo and scan measurement, machine-learning personalization, auto-forward, alteration reimbursement, resale, multi-supplier routing, B2B and wedding, gift cards and loyalty, automated collections, multi-currency, reviews, journal, and Spanish).

# Appendix B. Deferred to the architecture phase

These do not change the stories and are decided when architecture is defined. The account stories are written to be independent of the auth choice.

- Frontend framework (Next.js on Cloudflare, aligned with the founder's other application, is the front-runner).
- Authentication mechanism (magic-link versus password plus session).
- Email provider (Resend versus Cloudflare Email).
- Repository strategy (a fresh repository versus rebuilding in place).
- The precise physical layout of the canonical draft catalog data behind the two-environment publish model.

# Appendix C. Open verification items (live tests before launch)

- Confirm TWINT and the wallet methods appear on the Shopify draft checkout.
- Confirm the draft checkout uses CUTURA's custom shipping line and does not require the customer to pick a Shopify rate.
- Confirm Shopify computes and records Swiss VAT tax-inclusive so the total equals the displayed all-inclusive price.
- Confirm the Swiss textile labeling basis with a legal or compliance advisor.
- Confirm the company and legal data in the policy pages with a lawyer before launch.
