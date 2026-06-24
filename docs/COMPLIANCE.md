# Compliance and NFR checklist (E13 + NFRs)

The M7 acceptance gate is "the compliance and NFR checklist is green". This file
maps each requirement to its evidence (code/test) or its **founder/external owner**
where it cannot be satisfied in code (real data, lawyer/advisor sign-off, live
infrastructure). Keep current when behaviour changes.

Status key: **Done** (code + test), **Mechanism** (built; the live/external part is
flagged), **Owner** (founder/lawyer/advisor; not a code task).

## E13 - Compliance, privacy, trust, legal

| FR      | Requirement                                         | Status            | Evidence / owner                                                                           |
| ------- | --------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------ |
| FR-1301 | Minimal data, purpose per field                     | Done              | Data inventory below                                                                       |
| FR-1310 | Encrypt body measurements at rest                   | Done              | `packages/core/src/measurementCrypto.ts` (AES-256-GCM/HKDF)                                |
| FR-1320 | Full deletion, documented exceptions                | Done              | `packages/db/src/customers/privacy.ts` + `privacy.workers.test.ts` (no-PII-remains)        |
| FR-1330 | Data access + export                                | Done              | `exportCustomerData` + `/[locale]/account/privacy` (M4)                                    |
| FR-1340 | Retention + lifecycle rules                         | Done              | Retention table below                                                                      |
| FR-1350 | Consent banner gating analytics                     | Done              | `core/consent.ts` + `ConsentBanner`; no analytics loads without `hasAnalyticsConsent`      |
| FR-1360 | Real company data in legal pages                    | Mechanism / Owner | Imprint page seeded with `[to be completed]` fields; founder fills real data               |
| FR-1361 | No fabricated citations; lawyer review              | Mechanism / Owner | Seed copy is neutral/non-citational; **lawyer sign-off before launch**                     |
| FR-1362 | Version legal pages                                 | Done              | `content_page.version`; bump on edit (admin `/content`)                                    |
| FR-1370 | Record accepted Terms/Privacy on order              | Done              | `legal.ts` + checkout re-verify + `order.acceptedTermsVersion/acceptedPrivacyVersion` (M3) |
| FR-1380 | VAT correct + invisible                             | Done              | gross pricing (`core/pricing.ts`) + Shopify tax-inclusive (runbook) + all-inclusive label  |
| FR-1390 | Fibre composition on the PDP                        | Done              | `getPublishedModel` + PDP Materials section (M6)                                           |
| FR-1391 | Sewn-in label: composition + care, language-neutral | Done              | `SewnInLabel` in the supplier spec + PDF; `getFabricSewnInLabel`                           |
| FR-1392 | Confirm Swiss labeling basis                        | Owner             | Textile-labeling advisor                                                                   |
| FR-13A0 | All-inclusive consumer price                        | Done              | M3 pricing + checkout (0.00 shipping line, gross)                                          |
| FR-13B0 | Published fit-guarantee policy                      | Done              | `fit-guarantee` legal page (remake-first, refund fallback, keep original)                  |
| FR-1381 | VAT invoice once registered                         | Out               | Post-launch                                                                                |
| FR-13C0 | AI feature guardrails                               | Out               | Future (E11)                                                                               |
| FR-13D0 | Import VAT + inbound finance                        | Owner             | Post-launch; finance advisor                                                               |

## NFRs (M7 scope)

| NFR    | Requirement                                     | Status            | Evidence / owner                                                                         |
| ------ | ----------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| NFR-08 | D1 backups + tested restore + billing cap       | Mechanism / Owner | `infra/restore-drill.md` + `.sh`; live drill + cap are founder-run                       |
| NFR-10 | SSR / indexable storefront                      | Done              | Next App Router on Workers (OpenNext); sitemap + metadata                                |
| NFR-11 | Mobile perf budgets (Lighthouse/CWV) in CI      | Mechanism         | `.github/workflows/lighthouse.yml` (gated on `STAGING_URL`)                              |
| NFR-12 | WCAG 2.2 AA; configurator + wizard              | Mechanism         | `eslint-plugin-jsx-a11y` (via next/core-web-vitals) in the gate; `e2e/a11y.spec.ts` live |
| NFR-13 | Optimized, compressed, CDN media                | Mechanism         | R2 + cache-control on `/api/media/[id]`; Cloudflare Images is a go-live option           |
| NFR-14 | Graceful degradation (estimator down)           | Done              | Estimator seam falls back to detailed manual entry (M3)                                  |
| NFR-15 | Domain tests + past-failure guards              | Done              | deploy smoke, QC no-silent-pass, deletion completeness, pricing/snapshot suites          |
| NFR-16 | Measurement residency CH/EU                     | Owner             | R2 EU jurisdiction + D1 region selection at provisioning                                 |
| NFR-17 | Maintenance mode + clean degradation            | Done              | `maintenance` flag + layout gate; checkout 502 + `sendEmailAndLog` never throws          |
| NFR-18 | Bot/abuse protection (account/contact/checkout) | Done              | rate limits on auth/checkout/contact/notify + Turnstile hook                             |
| NFR-20 | SEO infra: sitemap, structured data, redirects  | Done              | `app/sitemap.ts` + `robots`; product JSON-LD; `redirect` table + middleware              |

## E11 - Recommendations + personalization (M8)

| FR                | Requirement                                             | Status | Evidence / owner                                                                                 |
| ----------------- | ------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------ |
| FR-1101           | Content-based + curated recommendations from owned data | Done   | `core/recommender.ts` baseline + `db/recommend` (catalog + attributes + cross-sell + own orders) |
| FR-1102           | Surface on home, product, cart, post-purchase, account  | Done   | `RecommendedSection` on home, PDP, cart, account, account order detail, guest track              |
| FR-1110           | Curated cross-sell, tastefully placed                   | Done   | `db/crosssell` (M6), blended first in the baseline; seeded shirt<->trousers                      |
| FR-1120           | Capture consented signals from the start                | Done   | `recommendation_signal` + `db/signals` + consent-gated `POST /api/signal`; PDP view beacon       |
| FR-1130           | Swappable recommendation interface                      | Done   | `core/recommender.ts` registry (mirrors the estimator seam); a fake-adapter test                 |
| FR-1140           | Purpose-clear data; consent-gate broader profiling      | Done   | baseline uses catalog/attributes/own-orders; signals gated by `hasAnalyticsConsent`              |
| FR-1141           | Measurements only for fit, never cross-customer         | Done   | the recommender takes catalog attributes only; body data is never an input                       |
| FR-1142           | Delete personalization data with the customer           | Done   | `deleteCustomerData` removes the customer's signals (+ test)                                     |
| FR-1150           | ML personalization behind the seam                      | Out    | Future (an adapter plugs into the recommender seam)                                              |
| FR-1160 / FR-1170 | AI try-on / prompt-to-bespoke                           | Out    | Future                                                                                           |

## Data inventory (purpose per field) - FR-1301

| Data                    | Where                                                     | Purpose                              | Deletion                                                          |
| ----------------------- | --------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------- |
| Email                   | customer, order.guestEmail, notifyRequest, contactMessage | Auth, order contact, notify, support | Hard-deleted / scrubbed on erasure                                |
| Body measurements       | measurementVersion, order_item.config_enc, snapshot       | Fit + production                     | Encrypted at rest; versions deleted, snapshot redacted on erasure |
| Address                 | address, order shipping (Shopify)                         | Delivery                             | Hard-deleted on erasure                                           |
| Marketing consent       | customer.marketingConsent                                 | Lawful marketing                     | Deleted with the customer                                         |
| Analytics consent       | `cutura_consent` cookie                                   | Gate optional analytics              | Client cookie; no server PII                                      |
| Accepted legal versions | order                                                     | Traceability of acceptance           | Retained (accounting)                                             |
| Recommendation signals  | recommendationSignal (consent-gated)                      | Personalization / future ML training | Deleted with the customer; no measurements or order contents      |
| Payment data            | none stored                                               | -                                    | N/A (Shopify-hosted)                                              |

## Retention - FR-1340

- **Measurements / profiles**: kept while the account is active; deleted on erasure.
- **Orders / accounting**: retained per Swiss accounting rules even after erasure,
  but scrubbed of PII + body data (guest identifiers cleared, config/snapshot
  removed). See `docs/PRIVACY.md` deletion policy.
- **Logs (audit, communication)**: retained for traceability; scrubbed of
  recipient PII on erasure.
- **Notify / contact**: removed on customer erasure (keyed by email).
- **Time Travel**: 30 days (D1 default).

## Pre-launch (founder + advisors)

Real imprint company data; lawyer sign-off of terms/privacy/imprint/shipping/
fit-guarantee; textile-labeling advisor (FR-1392) + import-VAT advisor (FR-13D0);
live Lighthouse + a11y passing; the executed restore drill + billing cap; D1/R2
region selection (residency); Turnstile keys.
