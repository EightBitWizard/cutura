# ADR 0008: Second garment type and recommendations

- Status: accepted
- Date: 2026-06-24

## Context

M8 proves the platform is garment-type-general (add a type as data + a module) and
turns on multi-item orders and recommendations (REQUIREMENTS.md E1 FR-104, E5
FR-502/523, E8 FR-850-852, E11). Much of the substrate already existed: the
estimator seam had a registered trouser module, the trouser measurement/outlier/QC
domain logic was ported, and pricing/snapshot/the configurator were already
garment-type-agnostic. The order pipeline already produced one package + QC per
item and shipped together.

## Decisions

1. **The measurement flow was the last shirt-coupling; removing it makes FR-104
   true.** `MeasurementFlow` + `/api/measurement` were hardcoded to shirt fields,
   `estimate("shirt")`, and `checkShirtOutliers`. M8 makes them garment-type-driven
   via a single source, `core/garmentFields.ts` (`garmentFields` + `wizardBaseFields`),
   and dispatches `estimate(garmentType)` + `checkOutliers(garmentType)`. After this,
   the trouser was added with **data only** (seed) plus the already-registered
   estimator module. We state this plainly: FR-104 holds from M8 onward.

2. **Measurements are stored per garment type.** A customer ordering a shirt and
   trousers needs both garment measurements. Guest KV is keyed by garment type;
   customers keep one profile per type (`getProfileIdForGarmentType`; save + migrate
   select/create by type). Checkout resolves each line's measurement by the line's
   garment type. `measurementVersion.garmentType` already existed, so this is a
   resolution change, not a schema change. Cart + checkout show measurement status
   per garment type.

3. **Multi-item was already built; M8 only adds a mixed-type regression test** (a
   shirt + trouser order: one package per item with the right garment type, QC'd
   independently with each type's checklist, shipped together only when both pass).
   We did not re-implement the pipeline.

4. **Recommendations sit behind a swappable seam, mirroring the estimator**
   (`core/recommender.ts`: interface + registry + a registered `baseline`). The
   baseline is content-based + curated: curated cross-sell first, then shared catalog
   attributes, prefers orderable, falls back to the orderable catalog with no signal.
   A future ML adapter registers under a strategy without a rewrite (FR-1130/1150).
   The DB layer (`db/recommend`) gathers candidates; ranking stays pure in core.

5. **Personalization is privacy-clean by construction.** Inputs are purpose-clear:
   the published catalog, model attributes, curated cross-sell, and - for a signed-in
   customer - their own past orders. Body measurements are never an input (FR-1141).
   Signal capture (`recommendation_signal`, migration 0006) is consent-gated by
   `hasAnalyticsConsent` (server + the client beacon) and never stores measurements
   or order contents (FR-1120/1140); it is deleted with the customer (FR-1142).

6. **Signals are captured from the start even though the baseline does not need
   them**, so a later ML model has real, consented training data.

## Consequences

New pure modules in `packages/core` (`garmentFields`, `recommender`); new db modules
`recommend` + `signals`; migration 0006 (`recommendation_signal`); a shared
`RecommendedSection` on home/PDP/cart/account/order/track. The trouser ships as seed
data (Chino Classic). M9 (production launch readiness) is the only remaining planned
milestone; bundle pricing (FR-1401), AI try-on, prompt-to-bespoke, and ML
personalization (FR-1150) remain Future, behind the seams M8 built.
