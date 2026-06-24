# ADR 0005: Operations and backoffice - settings, capacity/pause, outliers, KPIs

- Status: accepted
- Date: 2026-06-24

## Context

M5 turns the minimal admin into the founder's operational console (pipeline board,
fit-review queue, customer + supplier management, shipping config, capacity/pause,
KPIs, CSV export, admin notifications). A few decisions are worth recording.

## Decisions

1. **One typed settings seam over the existing `config` table.** `packages/db/src/config`
   wraps `config`/`featureFlag` with `getConfig`/`setConfig`/`getFeatureFlag`/`setFeatureFlag`.
   Operations settings live under one `operations` key validated by a zod schema in
   `packages/core` (`operationsSettings.ts`): capacity cap, manual pause + per-locale
   message, vacation window, lead-time buffer, high-water fraction, and the admin
   notification email. Reads default safely when unset, so adding a field never
   breaks stored settings (new fields are optional with defaults).

2. **One pause predicate, server-authoritative.** `isOrderingPaused(settings,
openOrderCount, now)` (core) = manual pause OR active vacation window OR
   `openOrderCount >= capacityCap`. The storefront blocks add-to-cart (`/api/cart`)
   and checkout (`/api/checkout`) on it and shows the configured message (or the
   calm default); the gate is enforced on the server, the UI only mirrors it.
   Lead times extend by a buffer past a high-water fraction of the cap
   (`effectiveLeadTime`) - an honest range, never a guaranteed date.

3. **Per-environment operational data; suppliers + settings live in the env DB.**
   Settings, suppliers, and shipping are operational (not publishable catalog), so
   the admin writes them directly to `environmentDb("staging")` where the storefront
   and the paid pipeline read them. This corrects an M2 gap where supplier authoring
   wrote to the control DB and never reached routing. Catalog entities still flow
   control -> publish -> environment.

4. **Outlier surfacing is computed, not stored.** The board + order detail run
   `checkOutliers` over the decrypted snapshot (or frozen config) and render a
   visible flag. The board returns only the boolean, never the measurements. (This
   is the regression guard for the known past bug where warnings did not display.)

5. **Pre-release correction respects snapshot immutability.** An audited correction
   appends a timestamped note to the production package's internal notes and writes
   an audit row; it does NOT mutate the immutable snapshot. Measurement changes go
   through the sanctioned remake path.

6. **Admin reads of measurements are audited (FR-1050).** `getCustomerAdminView`
   decrypts body measurements and writes a `customer.view` sensitive-access audit
   row. CSV export (`exportOrdersCsv`) carries order/money/dates only - never
   measurements or customer PII.

7. **Admin notifications reuse the email seam.** `notifyAdmin` sends to the
   configured `adminEmail` via the existing provider (faked in CI), logged in the
   communication log; it no-ops when no admin email is set. The paid webhook fires
   a `new_order` notification.

## Consequences

The live half (real admin emails, the end-to-end Staging operational loop) needs
Resend + Cloudflare provisioning. New data layers: `packages/db/src/{config,ops,kpi,
shipping,suppliers}`; new pure helpers in `packages/core` (`operationsSettings`,
`capacity`, `kpiMath`, `checkOutliers`). Schema change: additive `notes`/`tags` on
order + customer (migration 0003). RBAC roles, supplier-performance tracking, and
paid express shipping remain out (Post-launch/Future).
