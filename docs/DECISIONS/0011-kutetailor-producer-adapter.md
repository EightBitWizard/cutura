# ADR 0011: Kutetailor as producer, adapter seam, suit program

Date: 2026-07-09
Status: accepted

## Context

The launch producer (a small tailor in Vietnam) proved too small: fabrics not
reliably stocked, slow replies, unverified quality consistency. The producer
research (docs/research/production-partners.md, 106 candidates) and the founder
decision selected Kutetailor (Qingdao Kutesmart Co., Ltd., SZSE 300840): lot
size 1, ~7 working days production, large stocked fabric program, B2B portal.
Load-bearing facts still unconfirmed at decision time: a real order API (likely
the top subscription tier), the exact measurement schema, machine-readable
fabric/option codes, Switzerland shipping terms, own sewn-in labels, unit
prices. The founder wants to place the producer test order THROUGH CUTURA
(end-to-end test and quality review in one) and to keep manual control per
order at the start.

## Decision

1. **Producer adapter seam.** Suppliers carry an order channel in the existing
   `supplier.capabilities` JSON: `{ adapter, mode }`, parsed by
   `parseSupplierCapabilities` (packages/core/src/producerAdapter.ts).
   - No adapter: the classic spec email + PDF path (unchanged).
   - `mode: "manual"` (launch): approval renders an English producer order
     sheet on the admin order page; the founder enters it in the producer
     portal and advances the status by hand.
   - `mode: "api"` (prepared, inactive): `buildKutetailorApiPayload` builds the
     same canonical payload and hard-fails on unmapped codes. Activation is a
     data switch on the supplier row, not a rebuild. A status webhook route
     will drive `approved -> in_production -> arrived_ch` automatically later;
     until then two admin buttons drive the same guarded transitions.
2. **Producer catalog mapping.** New `producer_catalog_map` table (environment
   DB, next to `supplier`): (producer, entityType, entityKey) -> externalCode,
   keyed by stable CUTURA catalog CODES (model handle, fabric code,
   "group:value", upgrade code) so entries survive publishes and match what
   frozen order snapshots store. Unmapped codes never block the manual sheet;
   they render as warnings. The mapping is operational routing data and is
   never published to the storefront.
3. **Suit program, gender as garment-type keys.** Jackets and the women's line
   are new garment types `jacket`, `jacket_w`, `trouser_w` (not a gender flag),
   so field sets, estimators, outlier ranges, and QC templates stay
   independently swappable per cut. A suit is sold as jacket + trousers in one
   order (the existing multi-item model: produced and QC'd per piece, shipped
   together). Bundle pricing/discounts are deferred.
4. **Provisional women's estimation.** The women's jacket/trouser estimator
   formulas derive from standard female pattern-drafting proportions and are
   marked provisional until Kutetailor confirms its women's measuring
   guideline. Wide plausibility bounds plus the founder review gate catch
   implausible results; detailed manual entry always works. Suit catalog
   entries start as drafts with placeholder prices pending the RFQ.

## Consequences

- Copy changes: production location is China (never "Swiss made"; design and
  per-piece quality control remain in Switzerland).
- The measurement schema per garment type may still change when Kutetailor's
  portal schema is confirmed; the schema-migration path is proven (the shirt
  and trouser sets were already migrated once to a supplier guideline).
- Open RFQ items are tracked in docs/research/pivot-strategy.md and
  production-partners.md; the API adapter ships dormant until the endpoint and
  credentials exist.
