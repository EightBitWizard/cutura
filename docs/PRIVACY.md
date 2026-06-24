# Privacy

Body measurements are specially protected personal data under Swiss law. Privacy
by design: minimize, protect, use only for the stated purpose, fully deletable.

## Data we hold

- **Customer**: email, locale, marketing-consent state, deletion state. No
  password (magic-link). No stored payment data.
- **Measurements**: the three layers (original, derived, confirmed), versioned,
  encrypted at rest; effective values frozen into the immutable order snapshot.
- **Orders**: configuration, totals, accepted terms/privacy version, locale,
  guest tracking token.
- **Notify-me**: an email + the item + locale for back-in-stock notification
  (FR-361); minimal, and removed by customer deletion (it is keyed by email).

## Commitments (with the milestone that delivers each)

- **Encryption at rest** for body measurements (schema in place now; encryption
  wired in M3).
- **Full deletion** across all tables, with only documented legal/accounting
  retention; a customer can always export or delete their data (done M4;
  `deleteCustomerData`/`exportCustomerData` in `packages/db/src/customers/privacy.ts`).

### Deletion policy (delete vs scrub-and-retain)

Customer-initiated deletion (FR-670/671) does two things:

- **Hard-delete** (rows removed): measurement profiles + all versions, addresses,
  sessions (D1 + KV), fit reviews + feedback, notify requests, recommendation
  signals, and the R2 photos referenced by QC + fit-review records.
- **Scrub-and-retain** for Swiss accounting retention (rows kept, PII + body data
  removed): `order` (clear guest email + tracking token), `order_item` (null
  `config_enc`), `production_package` (redact `snapshot_enc`), `qc_record` (clear
  photo keys), `communication_log` (clear recipient), `payment_event` (clear
  payload). The `customer` row is tombstoned (email replaced, `deletionState =
deleted`) and kept as the foreign-key target; a tombstoned email cannot log back
  in. Encrypted body data is actively removed, not merely key-discarded, for
  provable erasure. The operation is idempotent and covered by a "no PII remains"
  Workers test.
- **Back-office access to measurements is audited** (FR-1050): the admin customer
  view writes a `customer.view` audit row when it decrypts body measurements. The
  CSV order export carries order/money/dates only - never measurements or customer
  PII (done M5).
- **Retention** windows documented for measurements, orders, and logs (done M7;
  see the retention table + data inventory in `docs/COMPLIANCE.md`).
- **Consent** banner gating analytics, pixels, and broader profiling (done M7;
  `hasAnalyticsConsent` is the single gate, opt-in); body measurements are used only
  for fit relevance inside CUTURA's boundary, never for cross-customer profiling.
- **Recommendations + signals** (done M8): personalization uses purpose-clear data
  (catalog, attributes, and a signed-in customer's own orders), never body
  measurements (FR-1141). Recommendation signals (`recommendationSignal`) are
  consent-gated by `hasAnalyticsConsent`, hold no measurements or order contents,
  and are deleted with the customer (FR-1142).
- **Residency**: measurement data resides in Switzerland or the EU (R2 EU
  jurisdiction; D1 region selection at provisioning).

- **Shopify GDPR webhooks** (done): the HMAC-verified webhook handles
  `customers/redact` (erases the matching customer via `redactCustomerByEmail` ->
  the audited deletion path; idempotent), and records `customers/data_request`
  (merchant-fulfilled out-of-band via the existing export) and `shop/redact` (never
  auto-wipes) in the environment audit log for the founder to action.

Never log measurements, addresses, order contents, or payment details; scrub
error reports. Document every third-party service that touches user data.

Update this file when data handling changes.
