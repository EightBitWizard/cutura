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
- **Payments**: Shopify-hosted checkout only; CUTURA never handles card data.
  Webhooks verified with timing-safe HMAC over the raw body, idempotent on the
  event id. [planned, M3]
- **Rate limiting** (KV) on login/magic-link, contact, checkout creation, and
  webhook-adjacent endpoints. [planned, M3/M4]
- **Body measurements encrypted at rest**: stored as ciphertext (`_enc` columns
  / encrypted snapshot blob); the schema enforces the column shape now. [schema
  done; encryption wired with the measurement flow, M3]
- **Migrations** are backwards-compatible; a code rollback does not revert D1, so
  recovery uses D1 Time Travel and export. [done]
- **CI** runs gitleaks secret scanning and an architecture guard. [done]

## Reviews

For security, privacy, payment, and measurement changes, run an adversarial
self-review against this checklist before committing: encryption at rest,
ownership checks, deletion completeness, secret handling, timing-safe comparisons,
no measurement/PII in logs.

Update this file on every security-relevant change.
