# Backup and restore drill (NFR-08)

CUTURA's source of truth is D1. D1 keeps point-in-time history (Time Travel, last
30 days), and we take on-demand SQL exports. This drill verifies that a restore
actually works - an untested backup is not a backup. Run it on **staging**
quarterly and after any schema or data-migration change.

Live execution requires the founder Cloudflare provisioning (`infra/setup-runbook.md`)
and `wrangler` auth; the steps + the helper script below are ready to run once that
exists.

## 1. Take an export (off-platform backup)

```bash
pnpm --filter @cutura/storefront exec wrangler d1 export cutura-staging --env staging --remote --output backup-staging.sql
# Production:
pnpm --filter @cutura/admin exec wrangler d1 export cutura-production --remote --output backup-production.sql
```

Store the export off Cloudflare (encrypted bucket / secure storage). It is plain
SQL: it contains encrypted body-measurement ciphertext, never plaintext.

## 2. Inspect Time Travel

```bash
pnpm --filter @cutura/storefront exec wrangler d1 time-travel info cutura-staging --env staging
```

This prints the current bookmark and the restore window.

## 3. Restore drill (staging)

Pick a timestamp a few minutes in the past, restore, and verify the app + a known
row.

```bash
pnpm --filter @cutura/storefront exec wrangler d1 time-travel restore cutura-staging --env staging --timestamp <ISO-8601>
```

Verify:

- `GET /api/health` on the staging URL returns `{ db: "ok" }` (the smoke test).
- A known seeded row is present (e.g. the Oxford base model on the storefront).
- `pnpm --filter @cutura/storefront exec playwright test --grep @smoke` against the
  staging URL passes.

Record the date, the restored timestamp, and the verification result in the release
log.

## Helper

`infra/restore-drill.sh <staging|production>` wraps steps 1-2 (export + Time Travel
info). The restore (step 3) is deliberately manual - it overwrites data.

## Billing cap (NFR-08)

Set a Cloudflare **billing notification + spend cap** in the dashboard
(Manage Account -> Billing -> Notifications) so runaway usage cannot produce an
unbounded bill. This is a dashboard setting, owned by the founder; record the cap
value in the release log.
