# Kutetailor onboarding: founder checklist + open items

Status: 2026-07-09. The platform side is built (producer adapter in manual
portal mode, mapping editor, status buttons, suit garment types as drafts; see
ADR 0011 and CHANGELOG). The steps below need the founder or a Kutetailor
answer; the list doubles as the agenda for the demo call.

## Founder steps (in order)

1. **Create the free Jumpstart account** on kutetailor.com (the $0/month tier
   orders single pieces; the "3-day trial" wording applies to the separate demo
   account, not to Jumpstart - double-check the terms behind the login).
2. **Book the demo call** (demo.kutetailor.com) and work through the RFQ
   questions below. Ask for written answers.
3. **Browse the portal catalog** and pick the concrete Kutetailor styles and
   fabrics for the CUTURA models (smart-casual set + the two suits). Enter the
   codes under admin -> Suppliers -> Producer mappings (types: model = CUTURA
   handle, fabric = CUTURA fabric code, option = group:value, upgrade = code).
4. **Place the test order through CUTURA** (staging): order on the storefront,
   pay via Shopify once provisioned OR use the synthetic-order path, approve in
   the admin, copy the producer order sheet into the portal, drive the status
   buttons. This is the end-to-end test and the quality gate (Gate 1) in one.
5. **Photograph the test garments** for the product pages (warm-neutral
   background + macro fabric shots); do not use Kutetailor's own imagery.
6. **Set real prices** for the suit models (drafts with placeholder prices)
   after the RFQ, then flip them to orderable and publish.

## RFQ / demo-call questions (the load-bearing unknowns)

1. Order API: does a real order-submission API exist, on which tier, and is
   there a written endpoint/field specification? (CUTURA's API mode is built
   and dormant; it activates via a data switch once this is confirmed.)
2. Measurement schema: exact per-garment body-measurement fields and units the
   portal expects; how fit preference/ease is expressed; confirmation that the
   factory derives the pattern from raw body measurements.
3. Women's line: does Kutetailor produce women's jackets and trousers at lot
   size 1, and what is their women's measuring guideline? (CUTURA's women's
   estimation formulas are provisional until this lands.)
4. Machine-readable catalog: stable style/fabric/option codes, exportable, so
   the producer mappings stay maintainable.
5. White label: sew-in of CUTURA's neutral label (composition + care symbols),
   neutral packaging, label artwork spec.
6. Switzerland logistics: carrier, incoterms (DDP vs DAP), who is importer of
   record, customs paperwork, cost and transit per single parcel.
7. Prices: per-piece price list (shirt, trouser, jacket incl. half/full canvas)
   at lot size 1, tier dependence, remake conditions and SLA.
8. Data protection: willingness to sign a DPA incl. EU standard contractual
   clauses for pseudonymous measurement data (order number only).

## Blocked items on the CUTURA side (need a founder decision or credentials)

- **Staging Shopify webhook secret**: the placeholder on staging does not match
  the local one, so the synthetic paid-order webhook cannot be fired against
  staging. Either rotate the staging secret (one wrangler command) or set the
  real secret when Shopify is provisioned. The full flow was verified locally
  end-to-end instead (approve -> order sheet -> in production -> arrived, with
  audit trail).
- **Shopify + Resend provisioning** (pre-existing): checkout and emails on
  staging need real credentials; see infra/setup-runbook.md.
- **Suit pricing + bundle presentation**: suits are sold as jacket + trousers
  (one order, one parcel); a bundle price/discount and a combined product page
  are open product decisions.
- **Kutetailor account tier**: stay on Jumpstart until the API is confirmed;
  the $169 tier is only worth it for the API mode.
