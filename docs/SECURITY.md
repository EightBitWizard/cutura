# Security

Posture for a platform holding specially protected body measurements. Items are
marked [done] where implemented in this foundation, [planned] where the milestone
that delivers them is upcoming.

## Principles

- **Secrets** live in Cloudflare Workers secrets and GitHub encrypted secrets;
  none in the repo. Required names are in `.dev.vars.example`. [done]
- **Admin auth is separate** from customer auth, on its own worker. Password
  checked timing-safe vs `ADMIN_AUTH_SECRET`; signed http-only KV-backed session;
  middleware gates the admin surface; KV rate limit on login; form redirects
  restricted to same-origin paths (`safePath`). [done, M2] Magic-link/RBAC later.
- **Customer auth** is magic-link with signed, http-only cookie sessions backed
  by KV; ownership enforced on every customer resource. [planned, M4]
- **Payments**: Shopify-hosted checkout (Draft Order invoiceUrl) only; CUTURA
  never handles card data. The paid webhook is verified with timing-safe HMAC
  (base64) over the raw body and is idempotent on the webhook id; a reconcile job
  backstops missed events. [done, M3]
- **Rate limiting** (KV) on login (done). Checkout-creation + webhook-adjacent
  limits are a follow-up. [partial]
- **Body measurements encrypted at rest**: AES-256-GCM (HKDF from
  `MEASUREMENT_ENCRYPTION_KEY`, per-purpose key) for the guest measurement KV
  blob, the checkout-frozen `order_item.config_enc`, and the production snapshot;
  the helper is pure and never logs plaintext. [done, M3]
- **Migrations** are backwards-compatible; a code rollback does not revert D1, so
  recovery uses D1 Time Travel and export. [done]
- **CI** runs gitleaks secret scanning and an architecture guard. [done]

## Reviews

For security, privacy, payment, and measurement changes, run an adversarial
self-review against this checklist before committing: encryption at rest,
ownership checks, deletion completeness, secret handling, timing-safe comparisons,
no measurement/PII in logs.

Update this file on every security-relevant change.
