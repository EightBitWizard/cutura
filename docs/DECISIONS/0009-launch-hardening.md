# ADR 0009: Launch-hardening (M9 codeable follow-ups)

- Status: accepted
- Date: 2026-06-24

## Context

All nine build milestones (M0-M8) are complete and the production release machinery
already exists (`release-production.yml`: a manual, environment-gated promotion with a
production smoke test). The rest of M9 (production launch readiness) is founder/live
work that a coding agent cannot do: provisioning, secrets, Shopify config, a real
paid order, lawyer sign-off, and DNS. This batch closed the deferred code follow-ups
that make the launch safer, building the mechanism + tests now and gating the live
half.

## Decisions

1. **Reconcile runs as a scheduled GitHub Action**, not an OpenNext `scheduled()`
   handler. `reconcile.yml` (6-hourly + manual) POSTs the existing bearer-guarded
   `/api/shopify/reconcile` endpoint - which the route already anticipated ("for a
   Cron/GitHub-Action trigger"). Gated on the `PRODUCTION_URL` var. This sidesteps
   fighting the OpenNext worker entry for a cron trigger.

2. **GDPR webhooks reuse the audited erasure path.** `customers/redact` ->
   `redactCustomerByEmail` (find by email -> `deleteCustomerData`; idempotent).
   `customers/data_request` + `shop/redact` are recorded in the environment audit log
   for the founder: data_request is merchant-fulfilled out-of-band via the existing
   export, and shop/redact never auto-wipes a single-store custom app's data.

3. **`middleware.ts` -> `proxy.ts`** in both apps (function renamed to `proxy`), per
   the Next 16 file-convention deprecation. Behaviour unchanged.

4. **Publish copies media objects, not just rows.** `publishEntity` takes an
   optional, injected control->target bucket pair and, after the atomic D1 batch,
   copies any published media object missing from the target bucket (idempotent via
   `head()`, self-healing on re-publish). Without this, published images 404 on
   staging/production. The publish routine stays R2-type-free (the admin route adapts
   its R2 buckets); the copy is a post-commit side effect, never inside the batch.

5. **Refund execution is injectable + audited + amount-free.** `executeOrderRefund`
   runs a money-back refund via an injected Shopify refund function (no amount set, so
   it never over-refunds), audited as executed/failed/no-shopify-order. The fit-review
   "refund" decision records as before and, when the admin has Shopify credentials,
   executes; otherwise it stays recorded-only. The live call is founder-gated.

6. **Live halves are deferred, not faked.** The reconcile schedule, real GDPR
   delivery, R2 copy on real buckets, and an actual refund all run only after the
   founder provisions secrets - each is built + fake-tested now and flagged.

## Consequences

New: `.github/workflows/reconcile.yml`; `redactCustomerByEmail` (privacy.ts);
`copyPublishedMedia` + a `MediaBucketPair` on `publishEntity`; `executeOrderRefund`
(orders/refund.ts) + an admin Shopify refund client + optional admin `SHOPIFY_*`.
No schema change. `proxy.ts` replaces `middleware.ts`. The remaining M9 work is
entirely founder/live (see docs/PLAN.md M9 + docs/COMPLIANCE.md): Cloudflare
provisioning + secrets, Shopify config + a real paid order, lawyer sign-off, DNS,
SPF/DKIM/DMARC, the executed restore drill + billing cap, and data residency.
