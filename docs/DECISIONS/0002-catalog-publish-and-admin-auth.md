# ADR 0002: Catalog publish routine, admin auth, and the D1 integration-test pool

- Status: accepted
- Date: 2026-06-24

## Context

M2 builds the no-code catalog admin and the publish-to-environment routine. A few
implementation decisions are worth recording.

## Decisions

1. **Publish routine** (`packages/db/src/publish/`). Publishing an entity resolves
   its dependency closure from the control database and copies it into the target
   environment database in one atomic D1 `batch`. Parents are copied by id
   (delete-then-insert, idempotent); owned children (option values, allow-lists,
   collection members, media, attribute values) are replaced by a scoped delete
   then re-insert, so children removed in control disappear on re-publish. Every
   statement is single-row, staying well under D1's 100-bound-parameter limit. The
   `publication` row uses a deterministic id (`type:id:env`) so re-publish updates
   it. **Unpublish** removes the top entity, its owned children, and the
   publication row, but leaves shared leaf rows (a fabric used by another model)
   in place - the simplest choice that avoids orphaning. Staging and production are
   isolated by being separate databases (FR-192 by construction).

2. **Admin auth** (`apps/admin/src/server/auth.ts`). A single founder authenticates
   with a password checked timing-safe against `ADMIN_AUTH_SECRET`; the session is
   a signed http-only cookie backed by a KV record (so logout/revocation works).
   Separate from customer auth and on its own worker. Magic-link and role-based
   access are deferred (M4 / post-launch). Crypto primitives are the pure Web-Crypto
   helpers in `packages/core/src/crypto.ts`.

3. **Catalog writes are encapsulated in `packages/db`.** Authoring helpers
   (`packages/db/src/catalog/`) and the publish routine are the only code that
   touches catalog tables; the apps call these helpers and never import
   `drizzle-orm` directly. This keeps queries testable on the Workers pool and the
   ORM out of the UI.

4. **D1 integration tests** use `@cloudflare/vitest-pool-workers` pinned to `~0.12`
   so the repo keeps Vitest 3.2 (v0.16 requires Vitest 4, a separate change). Two
   vitest configs in `packages/db`: the Node pool for pure logic + migration/seed
   validity (`*.node.test.ts`), and the Workers pool with real D1 for publish and
   query tests (`*.workers.test.ts`).

5. **Media** is stored in the `MEDIA_CONTROL` R2 bucket and referenced by `media`
   rows that are co-published with their entity. Public storefront media serving
   (Cloudflare Images / public R2) is a go-live refinement; the admin previews
   objects through an authenticated route.

## Consequences

No product-behaviour change beyond what the requirements specify. The publish
routine and admin auth are swappable behind their module boundaries. The vitest
pool pin is recorded in `docs/CONVENTIONS.md`.
