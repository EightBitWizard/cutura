# One-time setup runbook (founder)

These are the account-level steps only you can do. The code is ready; running
these unblocks the live staging deploy and the smoke gate. Copy-pasteable.

Prerequisites: a Cloudflare account on **Workers Paid/Standard** (the free plan
cannot fit a Next/OpenNext bundle), the GitHub repo, and `wrangler` logged in
(`pnpm --filter @cutura/storefront exec wrangler login`).

## 1. Create the three D1 databases

```bash
cd apps/storefront
pnpm exec wrangler d1 create cutura-control
pnpm exec wrangler d1 create cutura-staging
pnpm exec wrangler d1 create cutura-production
```

Paste each returned `database_id` into the matching `REPLACE_WITH_*_D1_ID`
placeholder in `apps/storefront/wrangler.jsonc` (staging, production) and
`apps/admin/wrangler.jsonc` (control, staging, production).

## 2. Create the KV namespaces

```bash
pnpm exec wrangler kv namespace create SESSIONS_STAGING
pnpm exec wrangler kv namespace create RATE_LIMIT_STAGING
pnpm exec wrangler kv namespace create SESSIONS_PRODUCTION
pnpm exec wrangler kv namespace create RATE_LIMIT_PRODUCTION
pnpm exec wrangler kv namespace create SESSIONS_ADMIN
pnpm exec wrangler kv namespace create RATE_LIMIT_ADMIN
```

Paste the ids into the `REPLACE_WITH_*_KV_ID` placeholders in the two wrangler
configs.

## 3. Create the R2 buckets

```bash
pnpm exec wrangler r2 bucket create cutura-media-control
pnpm exec wrangler r2 bucket create cutura-media-staging
pnpm exec wrangler r2 bucket create cutura-media-production
```

## 4. Set worker secrets (per environment)

```bash
# storefront staging
pnpm --filter @cutura/storefront exec wrangler secret put SESSION_SECRET --env staging
pnpm --filter @cutura/storefront exec wrangler secret put MEASUREMENT_ENCRYPTION_KEY --env staging
pnpm --filter @cutura/storefront exec wrangler secret put EMAIL_PROVIDER_KEY --env staging
pnpm --filter @cutura/storefront exec wrangler secret put SHOPIFY_ADMIN_API_TOKEN --env staging
pnpm --filter @cutura/storefront exec wrangler secret put SHOPIFY_WEBHOOK_SECRET --env staging
# Keep staging PRIVATE: set SITE_PASSWORD on staging only (HTTP Basic Auth gates the
# whole site). Do NOT set it on production - production must stay public.
pnpm --filter @cutura/storefront exec wrangler secret put SITE_PASSWORD --env staging
# repeat the others with --env production (but NOT SITE_PASSWORD)

# admin worker (no --env): login + session + the order-ops secrets
pnpm --filter @cutura/admin exec wrangler secret put ADMIN_AUTH_SECRET
pnpm --filter @cutura/admin exec wrangler secret put SESSION_SECRET
pnpm --filter @cutura/admin exec wrangler secret put MEASUREMENT_ENCRYPTION_KEY
pnpm --filter @cutura/admin exec wrangler secret put EMAIL_PROVIDER_KEY
```

`SHOPIFY_STORE_DOMAIN` + `SHOPIFY_API_VERSION` (= `2026-04`) are non-secret
[vars] per env in `apps/storefront/wrangler.jsonc`. `MEASUREMENT_ENCRYPTION_KEY`
must be identical on the storefront and admin workers (admin decrypts snapshots).
Secret names are listed in `.dev.vars.example`.

## 5. GitHub Actions secrets, variables, and the production gate

- Secrets (repo settings -> Secrets): `CLOUDFLARE_API_TOKEN` (scoped: Workers
  Scripts edit, D1 edit, R2, KV), `CLOUDFLARE_ACCOUNT_ID`.
- Variables (repo settings -> Variables): `STAGING_URL` and `PRODUCTION_URL`
  (the deployed urls the smoke test hits; start with the `*.workers.dev` urls).
- Create a GitHub Environment named `production` and add yourself as a required
  reviewer, so `Release to Production` waits for approval.

## 6. First migration apply

CI applies migrations on every staging deploy and on each production release.
To apply manually the first time:

```bash
pnpm --filter @cutura/admin exec wrangler d1 migrations apply cutura-control --remote
pnpm --filter @cutura/storefront exec wrangler d1 migrations apply cutura-staging --env staging --remote
pnpm --filter @cutura/storefront exec wrangler d1 migrations apply cutura-production --env production --remote
```

## 7. Shopify payment rail + email (M3 live verification)

The M3 code is complete behind fakes; the live order requires:

1. Create a Shopify **custom app** (Admin API) with scopes `write_draft_orders`,
   `read_orders`, `write_orders`. Copy the Admin API access token into
   `SHOPIFY_ADMIN_API_TOKEN` and the webhook signing secret into
   `SHOPIFY_WEBHOOK_SECRET`; set `SHOPIFY_STORE_DOMAIN` ([vars]).
2. Subscribe webhooks (Admin API version `2026-04`) to `https://<storefront>/api/shopify/webhook`:
   `orders/paid`, `orders/create`, `orders/cancelled`, `refunds/create`, and the
   three mandatory compliance topics.
3. Set the store **tax-inclusive** ("include tax in prices") for CH so VAT 8.1%
   is extracted from the gross; set the **only shipping zone to CH + LI**; enable
   Shopify Payments incl. TWINT.
4. Create a **Resend** account, verify the sending domain, set `EMAIL_PROVIDER_KEY`.
5. Run the end-to-end Playwright order on Staging (desktop + mobile) and one
   manual test order; verify TWINT, the supplier PDF with images, and the
   localized emails. Optionally schedule a cron to POST `/api/shopify/reconcile`
   (Bearer = `SHOPIFY_WEBHOOK_SECRET`).

## Deferred (later milestones)

- Move `cutura.ch` DNS to Cloudflare and attach custom domains
  (`staging.cutura.ch`, `cutura.ch`, `www`, `admin.cutura.ch`); update
  `STAGING_URL` / `PRODUCTION_URL` and add `routes` to the wrangler configs.
- SPF, DKIM, DMARC on the sending domain (M9).
