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

## Commitments (with the milestone that delivers each)

- **Encryption at rest** for body measurements (schema in place now; encryption
  wired in M3).
- **Full deletion** across all tables, with only documented legal/accounting
  retention; a customer can always export or delete their data (M4/M7). The data
  model enumerates every personal-data table so deletion is complete.
- **Retention** windows documented for measurements, orders, and logs (M7).
- **Consent** banner gating analytics, pixels, and broader profiling; body
  measurements are used only for fit relevance inside CUTURA's boundary, never
  for cross-customer profiling (M7/E11).
- **Residency**: measurement data resides in Switzerland or the EU (R2 EU
  jurisdiction; D1 region selection at provisioning).

Never log measurements, addresses, order contents, or payment details; scrub
error reports. Document every third-party service that touches user data.

Update this file when data handling changes.
