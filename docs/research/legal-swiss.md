# Swiss legal and compliance research

Business: Swiss D2C online shop, made-to-measure shirts and trousers, produced in Vietnam,
quality-checked in Switzerland, shipped to consumers. Launch market: Switzerland (+ possibly
Liechtenstein). Report date / all sources accessed: 2026-07-01.

> Diligent research, not legal advice. Every item flagged "verify with lawyer/tax advisor"
> needs professional sign-off before launch. Statutory text was cross-checked against official
> sources (fedlex, ESTV, BAZG, EDOEB, SECO, IGE); where a portal was JavaScript-gated, wording
> was confirmed via reputable secondary sources and is flagged. Nothing was invented.

> One theme runs through the whole report: **Liechtenstein is in the EEA and applies EU law.**
> Several "Switzerland is favorable" conclusions (no withdrawal right, no mandatory textile
> labelling, no GDPR) flip for the Liechtenstein slice. The cleanest simplification is to
> **launch Switzerland-only first** and add Liechtenstein once the EU-facing obligations are
> handled.

## 1. Imprint / provider disclosure (Impressum)

The e-commerce disclosure duty is in UWG Art. 3(1)(s). An online seller must give clear and
complete information about its identity and contact address including a working email; indicate
the technical steps to conclude a contract; provide input-error correction before the order;
and confirm the order electronically without delay. A configurator + web checkout is squarely
"electronic commerce", so the narrow individual-email exemption does not apply.

CUTURA must publish: full legal/firm name (exact registered name if in the commercial register,
OR Art. 954a); a real, deliverable postal address (a PO box alone is not enough); a working
email shown directly (a contact form alone does not satisfy the duty). Recommended (cheap,
trust-building): UID `CHE-xxx.xxx.xxx`, the VAT number `CHE-xxx.xxx.xxx MWST` (required on
invoices if VAT-registered), phone, legal form. Displaying the UID/VAT number on the site is
recommended, not strictly mandated; sole proprietorships must register in the commercial
register at CHF 100,000 turnover (OR Art. 934); GmbH/AG are registered by definition.

Also implement the checkout duties (contract steps, input-error correction, instant electronic
order confirmation). Breach of Art. 3(1)(s) is unfair competition (civil action Art. 9 UWG;
complaint-based criminal liability Art. 23 UWG). **Launch blocker: yes** for the three
mandatory imprint fields and the checkout duties.

## 2. AGB / terms for custom-made goods

No statute lists mandatory AGB contents, but the terms must survive Swiss validity/content
control. Two doctrines: the unusual-clause rule (globally-adopted terms bind only if the
customer had a genuine chance to read them; surprising clauses that materially change the
contract do not become part of it unless specifically highlighted; BGE 135 III 1, 77 II 154),
and UWG Art. 8 (consumer terms that create a significant, unjustified imbalance contrary to
good faith are void; ambiguities read against the drafter).

The AGB should cover: contract-formation moment (the display/configurator is an invitation, the
customer's order is the offer, the contract concludes only on CUTURA's acceptance, aligned to
the manual approval gate; the automated "order received" message is a receipt, not acceptance,
while still meeting the Art. 3(1)(s) confirmation duty); all-inclusive VAT-inclusive CHF
prices; payment up-front via the hosted checkout; honest buffered lead times, no guaranteed
date, CH (+ LI) only, multi-item ship-together; warranty and the voluntary fit guarantee kept
clearly separate from statutory rights; the no-statutory-withdrawal + made-to-measure
non-returnable statement. AGB must be actively accepted at checkout, unusual clauses
highlighted, every clause plain. Buried/one-sided clauses can be struck as unusual or void
(Art. 8 UWG). **Launch blocker: yes** - lawyer-drafted AGB, properly presented and accepted.

## 3. Consumer withdrawal / returns / cooling-off

**Switzerland has no general statutory right of withdrawal or cooling-off for online/distance
sales.** The only broad Swiss withdrawal right (OR Art. 40a-40g, doorstep/telephone contracts,
CHF 100 threshold, 14 days) does not cover ordinary web-shop checkout. This is the opposite of
the EU 14-day right. For custom-made goods the analysis is even simpler: there is no online
withdrawal right at all, so no custom-goods carve-out is needed in CH.

CUTURA may voluntarily offer or decline returns; a made-to-measure brand can legitimately
exclude change-of-mind returns while offering the fit guarantee as the trust mechanism. It must
not imply a statutory cooling-off right exists; best practice is to state plainly that Swiss law
gives no online withdrawal right, that garments are made to the customer's measurements, and
then describe the voluntary fit guarantee. Watch items: an EU-style 14-day distance right (with
a custom-goods exception) very likely applies to Liechtenstein consumers (verify before selling
to LI); and Motion 22.3476 proposes a future Swiss online withdrawal right (status unverified) -
design the returns flow so it could be accommodated. **Launch blocker: no for CH (favorable);
yes for the Liechtenstein slice.**

## 4. Statutory warranty for defects (Sachgewaehrleistung, OR Art. 197 ff.)

Under OR Art. 197 the seller is liable, independent of fault, for the absence of defects that
remove or materially reduce value/fitness, existing when risk passed. Duration: 2-year
prescription from delivery (OR Art. 210 para. 1); for consumer contracts the 2-year minimum for
new goods is mandatory and cannot be shortened (Art. 210 para. 4). Buyer must inspect and give
immediate notice of defects (Ruegepflicht, Art. 201); failure = acceptance fiction (except
hidden defects/fraud). Remedies: rescission or price reduction (Art. 205), replacement for
generic goods (Art. 206) - for a bespoke garment, a remake to spec is the natural equivalent.
Note: repair (Nachbesserung) is NOT a statutory sales remedy in Swiss sale law; CUTURA may offer
remake-first but cannot make repair the customer's only option for a genuine defect.

A voluntary fit guarantee is additional to and cannot waive/shorten the statutory warranty. The
two have different triggers: statutory warranty covers defects (faulty fabric/seams); the fit
guarantee covers fit outcomes on a correctly-manufactured garment. Present the fit guarantee as
an extra benefit, never a substitute. **Launch blocker: yes** at the AGB level (warranty clauses
must reflect the mandatory 2-year floor and the Art. 205/206 remedy set).

## 5. Privacy - revised Swiss FADP (revDSG/nDSG, SR 235.1)

The revised FADP entered into force 1 September 2023 (no grace period), with the Data Protection
Ordinance (SR 235.11), enforced by the FDPIC/EDOEB; sanctions are criminal fines up to
CHF 250,000 directed at the responsible individual for intentional breaches.

- **5a. Information duties (Art. 19-21).** The privacy policy must state controller
  identity/contact, purposes, recipients or categories, and if data goes abroad the country +
  the Art. 16(2) safeguard. CUTURA must name the recipients: the Vietnam tailor, Shopify
  (payment), the email provider, Cloudflare (hosting), the Swiss QC/logistics function - and
  disclose the Vietnam transfer + safeguard. **Hard launch blocker.**
- **5b. Are body measurements "sensitive" (Art. 5 lit. c)?** Best-supported analysis: probably
  NOT. Biometric data is sensitive only when it uniquely identifies a person; tailoring
  measurements collected to cut a garment (not to identify) are personal but not sensitive, and
  standard fit measurements are not health data (keep the questionnaire strictly fit-relevant;
  avoid weight/BMI/medical fields). This is the single most important judgment call - verify
  with lawyer; GDPR Art. 9 applies a stricter lens for the LI slice. Regardless, encrypting
  measurements at rest and keeping them in CH/EU is the correct conservative posture - keep it.
- **5c. Consent (Art. 6).** Core order fulfilment (account, measurements-for-manufacture,
  shipping) runs on contract performance - no separate consent needed; do not add a spurious
  checkout consent. Marketing, optional analytics, and any future AI/recommendation features
  need separate explicit opt-in, never bundled with checkout.
- **5d. DPIA (Art. 22).** Likely not strictly required, but the Vietnam transfer and body data
  push toward doing a proportionate DPIA voluntarily (cheap, defensible). Recommended.
- **5e. Records of processing (Art. 12).** Under 250 employees = presumptively exempt, but given
  the model is entirely body data, keep a record anyway (near-free).
- **5f. GDPR / EU representative - the Liechtenstein trap.** GDPR (Art. 3(2)) catches a non-EU
  controller offering goods/services to EEA data subjects. Liechtenstein is in the EEA. Selling
  and shipping to LI consumers in their language/currency likely triggers GDPR extraterritorially,
  and because that trade is regular/core, an EU/EEA representative (Art. 27) may be required. A
  Switzerland-only launch avoids GDPR entirely - the cleanest fix. **Verify with lawyer - highest
  priority.**
- **5g. Data residency and transfers (Art. 16-18).** Transfers abroad need an adequate country or
  an Art. 16(2) safeguard. Neither the USA nor Vietnam is on the adequate list. Keep
  personal/measurement data in CH/EU (Cloudflare region); Shopify/Cloudflare are US-based and
  need their DPA + SCCs.
- **5h. Vietnam transfer of body measurements - the concrete blocker.** Vietnam is not adequate,
  so the CH->Vietnam transfer of the production spec + measurements requires SCCs. CUTURA must:
  execute a DPA + FDPIC-recognised EU SCCs (2021/914 + Swiss addendum) with the producer
  (a processor); minimise (send only what is needed, using a pseudonymous order reference rather
  than full identity where possible - the snapshot design supports this); disclose the transfer +
  safeguard in the privacy policy and record it; consider a transfer impact assessment. **No
  customer measurements should reach the Vietnamese producer in live operation until the DPA +
  SCCs are executed. Hard launch blocker.**

## 6. VAT / MWST + import

CUTURA is a Swiss importer-seller (imports the garments itself, QC in CH, ships domestically),
so the foreign mail-order rules do not apply to it.

- VAT registration mandatory at CHF 100,000 worldwide taxable turnover (MWSTG Art. 10); because
  CUTURA imports goods, voluntary registration at launch is advantageous (recover import VAT as
  input tax). Effective launch blocker.
- Rate: standard 8.1% (since 1 Jan 2024, unchanged 2026). Clothing is standard-rated. Applies
  identically to CH and Liechtenstein (CH-FL VAT/customs union). Wire into pricing. Launch blocker.
- Tax-inclusive display (PBV): show the all-in VAT-inclusive price everywhere; VAT is never a
  separate customer choice. Launch blocker (matches CUTURA's invariant).
- Customs duty on textiles from Vietnam: CHF 0 (Switzerland abolished industrial tariffs 1 Jan
  2024 for HS 25-97, all origins). Still declare/clear at the border; budget zero duty.
- Import VAT (Einfuhrsteuer): 8.1%, paid by CUTURA as importer on the customs value; once
  registered, reclaim as input tax. Net tax to the state = 8.1% on the domestic sale.
- Mail-order (Versandhandel 2019) and platform taxation (1 Jan 2025) target foreign small-parcel
  senders and marketplace operators; CUTURA is neither. Not applicable.
- Do not confuse the CHF 5 import-VAT small-consignment waiver with the CHF 150 traveller
  allowance (reduced from CHF 300 on 1 Jan 2025), which applies only to goods physically carried.

Verify with tax advisor: registration timing, Liechtenstein specifics, exact HS classification,
VAT-invoice content, any future drop-ship-from-Vietnam scenario.

## 7. Textile labelling

Fibre-composition and care labelling are voluntary in Switzerland (confirmed by GINETEX
Switzerland for 2026); no mandatory federal fibre/care/origin rule. But any composition CUTURA
declares must be truthful (a false claim is actionable under UWG). GINETEX care symbols are
registered trademarks - using them needs a per-company GINETEX care-labelling licence (resolve
early; not strictly a launch blocker). CUTURA's language-neutral sewn-in label (composition +
international care symbols) is compliant for CH/FL subject to the licence + accurate composition.
For any future EU sale, Regulation (EU) 1007/2011 makes fibre-composition labelling mandatory
(hard requirement, re-check at EU entry). **Launch blocker: no for CH/FL; GINETEX licence is a
do-early item.**

## 8. Price indication (PBV, SR 942.211)

The Detailpreis (actual CHF price payable, including VAT and all non-optional surcharges) must be
shown to consumers; VAT may not be shown separately or added on top. This matches CUTURA's
all-inclusive model - compliant by design. Shipping need not be folded into the product price but
must be disclosed clearly before the customer is bound (never a silent shipping line); an
optional paid express method may be shown separately. Discount rule: any "was X / now Y" must use
a genuinely-charged prior price, limited comparison window (self-comparison, max 2 months; Art. 16
PBV, revised 30 Oct 2024); no fictitious originals, no vague "up to X%". **Launch blocker: no** for
the base pricing; discount rules bite only if CUTURA runs sales.

## 9. Other legally important items

- **9a. "Swiss made" / Swissness (MSchG; IGE).** Garments are industrial products, so a
  Swiss-origin claim requires BOTH >=60% of manufacturing cost in Switzerland AND the essential
  manufacturing step in Switzerland. Producing in Vietnam, **CUTURA cannot lawfully claim "Swiss
  made", "Made in Switzerland", "Schweizer Qualitaet", or use the Swiss cross as a product-origin
  mark.** QC in Switzerland is not the essential step. Allowed: truthful activity/company claims
  ("Designed in Switzerland", "a Swiss brand", "quality-controlled in Switzerland"). Forbidden:
  "Swiss made" on garments, the Swiss cross/coat of arms as a general origin signal, oversized
  "SWISS" that implies origin. Audit all copy, labels, packaging, metadata. **Hard copy blocker.**
- **9b. Packaging / recycling.** No general Swiss packaging EPR regime today; VVEA reforms in
  consultation from autumn 2026. No obligation now. Not a blocker.
- **9c. Unfair competition / greenwashing (UWG).** Art. 3 bans untrue/misleading statements about
  origin, quality, comparisons. The greenwashing rule Art. 3(1)(x) UWG (in force 1 Jan 2025)
  targets climate claims with a de-facto reversed burden of proof: do not claim "climate
  neutral"/"CO2-neutral"/"sustainable" without documented substantiation ready at publication;
  safest launch posture is to make no unsubstantiated environmental claims. Never claim a
  guaranteed fit/delivery/tax/production outcome. **Partial blocker:** a hard gate on copy.

## Must-do before launch (prioritized)

1. Vietnam data transfer: execute DPA + FDPIC-recognised SCCs (EU 2021/914 + Swiss addendum) with
   the producer and minimise the data sent, before any customer measurements are transmitted. (5h)
2. Decide the Liechtenstein question. Simplest: launch Switzerland-only (avoids GDPR, EU
   representative, EEA withdrawal-right); add LI later with the EU posture in place. (3, 5f)
3. Publish a compliant, lawyer-reviewed privacy policy incl. the Vietnam transfer + safeguard and
   all recipients. (5a)
4. Register for Swiss VAT (voluntarily at launch); wire 8.1% VAT-inclusive pricing; pay + reclaim
   import VAT; budget zero customs duty. (6)
5. Publish the imprint (legal name + deliverable address + real email; add UID + `CHE-... MWST`);
   implement the checkout duties. (1)
6. Lawyer-drafted AGB, actively accepted, unusual clauses highlighted: formation aligned to the
   approval gate; 2-year mandatory consumer warranty with the correct remedy set; no statutory
   online withdrawal + made-to-measure no-return; fit guarantee kept separate. (2, 3, 4)
7. Swissness copy audit: remove any "Swiss made"/Swiss-cross-as-origin claim; keep only truthful
   activity/company claims. (9a)
8. UWG copy gate: no unsubstantiated climate/eco claims; honest origin and guarantee wording; no
   guaranteed fit/delivery. (9c)
9. Data residency in CH/EU + transfer safeguards for Shopify/US + email; separate explicit opt-in
   for marketing/analytics/future AI. (5c, 5g)
10. Obtain a GINETEX licence before printing care symbols at scale. (7)
11. Keep a record of processing and a proportionate DPIA. (5d, 5e)

## Confirm with a Swiss lawyer / tax advisor

- Highest priority: whether Liechtenstein sales trigger GDPR + an Art. 27 EU representative, and
  whether to launch CH-only first. (5f)
- Sensitive-data classification of body measurements under the FADP and GDPR Art. 9. (5b)
- Vietnam SCC/DPA package + transfer impact assessment; status of any Swiss-US data-privacy
  framework before using US processors. (5g, 5h)
- AGB drafting: formation/approval-gate wording; warranty clause; Ruegepflicht fairness for
  consumers; fit-guarantee vs statutory-warranty separation. (2, 4)
- Liechtenstein consumer law generally (imprint, AGB, withdrawal). (3)
- VAT: registration timing, LI specifics, exact HS classification, VAT-invoice content, any
  drop-ship-from-Vietnam scenario. (6)
- Verbatim statutory text of the OR/PBV/MSchG articles cited (several official portals were
  JavaScript-gated).
- Exact scope/effective date of Art. 3(1)(x) UWG (greenwashing); GINETEX licence cost/coverage.
- Current status of Motion 22.3476 (a future statutory online withdrawal right).
- Commercial-register / legal-form formation and bookkeeping consequences.

## Sources (accessed 2026-07-01)

Primary/official: UWG SR 241 (fedlex.admin.ch/eli/cc/1988/223_223_223/de); ESTV VAT registration

- rates (estv.admin.ch); BAZG industrial-tariff abolition (bazg.admin.ch); SECO tariff scope +
  online-shopping guide + PBV (seco.admin.ch); federal SME portal on import VAT, no online
  withdrawal right, records-of-processing exemption (kmu.admin.ch); FDPIC on cross-border transfers
- sanctions (edoeb.admin.ch); Data Protection Ordinance SR 235.11 (fedlex); IGE Swissness criteria
- FAQ (ige.ch); PBV SR 942.211 (fedlex); EU Reg. 1007/2011 (eur-lex.europa.eu).

Authoritative commentary (used where official portals were JS-gated; verify verbatim at sign-off):
Univ. Zurich OR warranty e-learning (rwi.uzh.ch); Stiftung fuer Konsumentenschutz on the 2-year
warranty and no return right (konsumentenschutz.ch); Walder Wyss on the unusual-clause rule + Art.
8 UWG (walderwyss.com); Steiger Legal on the adequacy list and biometric-data classification
(steigerlegal.ch); datenschutz.law on FADP Art. 5/19/20; IAPP on GDPR Art. 27; TermsFeed on
Liechtenstein/EEA => GDPR; GINETEX Switzerland (ginetex.ch) + GINETEX care-symbol licence
(ginetex.net); Justis on Art. 40a scope (justis.ch); Teichmann on online contract formation
(teichmann-law.ch); Intep + Vischer on the Art. 3(1)(x) UWG greenwashing rule; parlament.ch Motion
22.3476 (status unverified, page blocked).

Key uncertainties: (1) whether body measurements are legally "sensitive" (best analysis: no, but
verify); (2) whether LI sales trigger GDPR + an EU representative (best analysis: yes - so launch
CH-only first or handle it); (3) exact verbatim statutory wording (several fedlex pages were
JS-gated); (4) status of Motion 22.3476 and exact scope/date of Art. 3(1)(x) UWG; (5) Liechtenstein
consumer/imprint/AGB law was not researched in depth.
