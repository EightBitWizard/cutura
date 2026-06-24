# ADR 0007: Compliance, trust, and hardening

- Status: accepted
- Date: 2026-06-24

## Context

M7 makes CUTURA lawful, private, and operationally safe: consent, legal pages,
contact, maintenance mode, bot/abuse protection, SEO infrastructure, the sewn-in
label, perf/a11y in CI, and a backup/restore drill. Much of it hardens or verifies
systems already built (encryption, deletion, VAT, version capture). A few decisions
are worth recording.

## Decisions

1. **Consent is a single gate.** No analytics is integrated; `hasAnalyticsConsent`
   (core, over the `cutura_consent` cookie) is the one chokepoint any future
   analytics/pixel must pass. The banner defaults to declined. This makes optional
   processing lawful by construction (FR-1350).

2. **Legal content is DB-backed + honest, never fabricated.** Pages are seeded with
   neutral copy: shipping + fit-guarantee describe actual system behaviour;
   terms/privacy/imprint state intent with explicit `[to be completed]` fields.
   Real company data, citations, and lawyer sign-off are founder/lawyer-owned and
   gated in `docs/COMPLIANCE.md` (FR-1360/1361). We never invent legal claims.

3. **Maintenance mode is a settings flag gated in the storefront layout**, not the
   middleware - the admin is a separate worker and `/api` routes are outside the
   layout, so the founder can always reach the admin to turn it off and webhooks
   keep working (NFR-17).

4. **Bot/abuse protection is layered + provisioning-tolerant.** Rate limits (KV) on
   auth, checkout, contact, and notify; a Turnstile verify that is a pass-through
   no-op until `TURNSTILE_SECRET` is set, then enforces (NFR-18).

5. **Redirects + structured data.** A `redirect` table is checked by the storefront
   middleware (exact-path); product JSON-LD is rendered on the PDP with `<`
   escaped so catalog content cannot break out of the script tag (NFR-20).

6. **Sewn-in label = one standard, language-neutral label** (composition + care
   symbols) carried in the supplier spec/PDF; localized care text stays on the
   parcel card (FR-1391). The Swiss labeling basis is advisor-confirmed (flagged).

7. **Perf/a11y: static now, live deferred.** `eslint-plugin-jsx-a11y` (via
   next/core-web-vitals) runs in the gate; Lighthouse + an axe-style Playwright
   spec are wired against the deployed URL and run post-provisioning, like the
   smoke test (NFR-11/12).

8. **Backup/restore is documented + scripted + drilled** (`infra/restore-drill.md`),
   with the live drill + billing cap owned by the founder (NFR-08).

## Consequences

New pure helpers in `packages/core` (`consent`, `turnstile`, `productJsonLd`,
`SewnInLabel`); new db modules `contact`, `redirects`; migration 0005
(`contact_message`, `redirect`). `docs/COMPLIANCE.md` is the living FR/NFR evidence
map; the launch gate is the set of founder/lawyer/advisor + live-infrastructure
items it lists. Out: VAT invoice, AI guardrails, import VAT (Post-launch/Future).
