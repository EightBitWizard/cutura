# ADR 0003: Payment rail, order pipeline, and measurement encryption

- Status: accepted
- Date: 2026-06-24

## Context

M3 makes one shirt orderable end to end. It introduces the Shopify payment rail,
the order pipeline, body-measurement encryption, the supplier PDF, and
transactional email. The decisions below were researched against the current
Shopify Admin GraphQL API and validated by design agents.

## Decisions

1. **Shopify is the payment rail only, via Draft Orders (Admin GraphQL `2026-04`).**
   Checkout creates a draft with one custom line item per garment priced by
   `originalUnitPriceWithCurrency` (a server-recomputed gross), config + measurement
   references in `customAttributes` (`_`-prefixed, hidden from the customer), and a
   `shippingLine` of CHF 0.00. Standard shipping is folded into the item gross, so
   the displayed total equals the charged total with no shipping line shown
   (FR-710/711 + FR-731 reconciled). Tax-inclusive pricing is a store setting (not
   an API field); Shopify extracts CH VAT 8.1% identically to `vatBreakdown`. The
   customer pays via the draft's `invoiceUrl` (no card data touches CUTURA). The
   typed `ShopifyClient` lives in `packages/core`; the live fetch client in the
   storefront; no live calls in CI.

2. **Paid ingestion is webhook-driven + reconciled.** `orders/paid` (with
   `orders/create` as a backstop) is HMAC-SHA256 (base64) verified over the raw
   body, timing-safe, and idempotent on `X-Shopify-Webhook-Id` (the `paymentEvent`
   PK). Because the paid webhook is documented to sometimes not fire for draft
   checkouts, a reconcile function re-runs the same idempotent pipeline for any
   paid Shopify order missing a package (synthetic `reconcile:<id>` key); the cron
   trigger is a follow-up.

3. **The order pipeline lives in `packages/db/src/orders`** (drizzle stays in db).
   `processPaidEvent` builds the immutable snapshot from the checkout-frozen,
   encrypted `order_item.config_enc` (independent of the transient KV measurement),
   so it is durable and exactly-once (paymentEvent PK + productionPackage unique).
   Transitions are guarded by the core status machine, audited via `status_event`,
   and rolled up (slowest item). QC never silently passes: a failed checklist
   routes to `qc_failed` and the only path to `qc_passed` is the audited
   `applyQcOverride` (qc_failed only). Shipping releases together only when every
   item passes QC.

4. **Body measurements are encrypted at rest** with AES-256-GCM, the key derived
   by HKDF-SHA256 from `MEASUREMENT_ENCRYPTION_KEY` with a per-purpose label
   (`measurement_version` for the KV guest blob, `snapshot` for the order config +
   production snapshot). The helper is pure Web-Crypto in `packages/core` (the
   secret is an argument; it never logs plaintext or key).

5. **Guest-only flow (M4 adds accounts).** The cart and measurement live in KV
   keyed by HttpOnly cookies; the cart stores no prices (recomputed every read);
   measurements are frozen (encrypted) into the order at checkout. Pricing is
   server-authoritative at `/api/price`, add-to-cart, and checkout - the client
   number is never trusted.

6. **Supplier PDF via `pdf-lib`** (pure JS, Workers-compatible), generated on
   approval (CPU headroom, not on the webhook), images fetched through an
   injectable R2 seam with a placeholder fallback. **Email via a `fetch`-based
   Resend client** behind an `EmailProvider` interface (+ a fake), localized by the
   order locale, every send logged to `communication_log`.

## Consequences

The live half of the M3 gate (a real draft order, TWINT, the paid webhook, emails,
the manual test order) requires the founder to create the Shopify custom app +
Resend account and run the provisioning runbook. Everything is built behind typed
boundaries and proven locally on the Workers/Node pools.
