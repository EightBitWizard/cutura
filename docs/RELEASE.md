# Release process

Two distinct release paths. Keep them separate.

## Code release

- `main` is the trunk; CI runs the gate on every PR and push.
- On push to `main`, `ci.yml` deploys both apps to **Staging** (migrations
  applied first), then runs the live-url smoke test.
- **Production** is manual and gated: the `Release to Production` workflow
  (`workflow_dispatch`) waits for approval via the GitHub `production`
  environment, applies production migrations, deploys, runs the production smoke
  test, and tags the release.

Migrations run **before** deploy and are backwards-compatible (expand then
contract): a Workers rollback does not revert D1, so new schema must remain
compatible with the currently running code during the window.

## Catalog release (content, no code deploy)

Built in M2: author an entity in the admin as a draft, publish to Staging, verify
on the staging shop, publish to Production. The publish routine resolves the
dependency graph and upserts the published version into the target environment
database, transactionally and idempotently, with an audit record.

## Rollback and recovery

- Code: `wrangler rollback --env production` (immediate; does not revert D1/KV/R2;
  uses current secrets; blocked if a Durable Object migration occurred between
  versions).
- Data: `wrangler d1 time-travel restore <db> --timestamp <ISO>` (any minute in
  the last 30 days) and `wrangler d1 export <db> --remote` for an off-platform
  copy. The tested restore drill (run quarterly + after any migration) and the
  billing-cap setup are in `infra/restore-drill.md` (helper: `infra/restore-drill.sh`).

## Smoke test

Mandatory after every deploy. It hits the deployed url and asserts rendered
content plus a live DB via `/api/health`. Production is not considered released
unless it passes.
