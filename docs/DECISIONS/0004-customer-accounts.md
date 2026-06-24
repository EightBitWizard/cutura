# ADR 0004: Customer accounts - magic-link auth, sessions, and the delete-vs-scrub policy

- Status: accepted
- Date: 2026-06-24

## Context

M4 adds the registered customer experience (accounts, profiles, order history,
reorder, fit review/remake, feedback, data rights) on top of the guest flow. A
few decisions are worth recording.

## Decisions

1. **Passwordless magic-link auth** (`apps/storefront/src/server/auth.ts`,
   `packages/core/src/magicLink.ts`). A request emails a single-use link whose
   SHA-256 hash (not the token) is stored in KV with a 15-minute TTL; verification
   consumes it (get-then-delete). Issuance + verification are rate-limited (per
   email + per IP), and the request endpoint returns a neutral response regardless
   of whether the account exists (no enumeration). Account recovery is the same
   flow. In non-production, the link is also returned so staging works before
   Resend is provisioned.

2. **Customer sessions mirror the admin pattern**: a signed http-only cookie
   (`cutura_session`) backed by a KV record (`customer-session:{id}` -> customerId)
   so verification is one KV read (no D1 on the request path) and logout/deletion
   revokes instantly. A D1 `session` row is written through as the SQL enumeration
   source for deletion. The storefront middleware gates `/[locale]/account/*`.

3. **Registration side effects**: on first login, claim prior guest orders by
   email (keeping the guest tracking identifiers so in-flight links survive) and
   migrate the guest's transient KV measurement into a durable, re-encrypted D1
   profile. A tombstoned (deleted) email cannot log back in.

4. **All customer data access is ownership-filtered in the query** (`customerId`
   in the WHERE clause), never trusting a caller-supplied owner. A separate
   customer-facing order read hides internal QC/supplier/cost data; the status
   timeline maps internal statuses to four customer milestones.

5. **One-click reorder** carries no body data in the cart: a reorder line stores
   only selection codes + the mode (keep/update/override); checkout resolves the
   measurement from D1 (source order, latest profile, or source + deltas) and
   freezes a brand-new snapshot. The original order/snapshot is never mutated.

6. **Remake** is a linked, unpaid internal order built from the ORIGINAL
   production snapshot (+ optional adjustment), entering at in_review. Refunds run
   through the existing Shopify `createRefund` (live-deferred).

7. **Deletion = delete personal data, scrub-keep accounting records** (FR-670/671).
   Personal data (profiles + versions, addresses, sessions, fit reviews + feedback,
   notify requests, R2 photos) is hard-deleted. Order/orderItem/productionPackage/
   statusEvent/qcRecord/communicationLog/paymentEvent rows are KEPT for Swiss
   accounting retention but actively scrubbed of PII and body data (guest
   identifiers cleared, `config_enc` nulled, `snapshot_enc` redacted, recipient
   emails + payment payloads cleared, photos deleted). Encrypted body data is
   actively removed (not merely key-discarded) for provable erasure. The customer
   row is tombstoned (kept as the FK target). The operation is idempotent and
   returns a report; a Workers "privacy gate" test asserts no PII remains across
   every table.

## Consequences

The live half of the M4 gate (real magic-link emails, the end-to-end flow) needs
Resend + Cloudflare provisioning. The data layer lives in `packages/db/src/customers`
(apps never import drizzle). Schema change: an additive `measurement_profile.archived_at`
column (migration 0002).
