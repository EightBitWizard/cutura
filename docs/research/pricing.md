# Pricing recommendation

Prepared 2026-07-01. CHF unless noted. Every assumption is flagged; a "confirm these inputs"
list is at the end.

## Key inputs

- USD -> CHF: 0.81 (conservative). Swiss VAT 8.1% (tax-inclusive; back out via retail / 1.081).
  Zero customs duty on VN textiles; import VAT reclaimable once registered.
- Payment fees (Shopify Basic): Swiss card 2.95% + CHF 0.30, +7.7% VAT on the fee (~3.18%
  effective); TWINT ~1.6% all-in. Model uses worst-case card; a high TWINT share is upside.
- Founder costs: production ~$65 shirt / ~$85 trouser; inbound VN->CH freight $48 standard /
  $120 eco / $177 express; domestic CH parcel CHF 9 (<=2 kg); packaging ~CHF 4/order.

## The critical assumption: inbound freight is PER SHIPMENT, not per garment

The founder's first test order was one garment, so $48 looked per-garment; at real volume you
consolidate orders into one shipment. Freight/garment: 1 item = CHF 38.9 (worst case), 2 = 19.4,
**4 (base case) = 9.7**, 6 = 6.5, 10 = 3.9. Base case uses 4 garments/shipment. **Confirm this.**

## Landed cost per garment (base case, conservative single-item view)

| Cost line                          |            Shirt |          Trouser |
| ---------------------------------- | ---------------: | ---------------: |
| Production ($65/$85 @ 0.81)        |            52.65 |            68.85 |
| Inbound freight (allocated, $48/4) |             9.72 |             9.72 |
| Domestic CH parcel (per order)     |             9.00 |             9.00 |
| Packaging (per order)              |             4.00 |             4.00 |
| Payment fee (~CHF 169 sale)        |             5.69 |             5.69 |
| Remake/returns allowance (10%)     |             ~7.5 |             ~9.2 |
| Overhead allowance                 | 0 (not modelled) | 0 (not modelled) |
| **Total landed COGS**              |        **~88.6** |       **~106.4** |

On a multi-item order (shirt + trouser), freight/domestic/packaging are shared once, so a
CHF 169 shirt + CHF 189 trouser order = net rev CHF 331, COGS ~203, **gross margin ~CHF 128
(39%)** - the real blended margin sits above the single-item figures below.

## Recommended retail prices (CHF, VAT-inclusive)

Margin % = conservative single-item.

**Shirts** (Oxford Business, Camp Collar, Linen Essential): lower CHF 149 (36%), **primary
CHF 169 (43%)**, higher CHF 179 (46%).

**Trousers** (City Pleated, Drawstring): lower CHF 179 (36%), **primary CHF 189 (39%)**, higher
CHF 199 (42%).

**Recommendation: shirts CHF 169, trousers CHF 189.** Rationale: above the value/global tier
(Hockerty ~$59, Tailor Store ~$79 => ~CHF 48-64; pricing near them signals "cheap import");
credible vs premium online (Proper Cloth from $125, Suitsupply $119, both starting prices that
climb); lands inside the Swiss in-person band (Alferano CHF 179, Emanis CHF 180, PKZ CHF 159)
while offering online convenience. The current placeholders (129/149) are too low and
under-signal quality.

## Surcharge / shipping / bundle logic

- **Fabric tiers (not per-cent):** Signature (included) = base; Premium (+CHF 20-30, e.g. linen -
  note linen production cost equals cotton, so a linen surcharge is pure margin + positioning);
  Luxury (+CHF 40-60) later. Applied server-side on the base as one all-inclusive price.
- **Options:** keep base fit + standard construction included (matches the calm brand); charge
  only real upgrades (contrast details, monogram, special buttons) at +CHF 10-25; minor style
  variants included or +CHF 5-10.
- **Standard shipping: keep FREE** (included). At CHF 169+ a separate CHF 9 charge hurts
  conversion more than it helps; "price shown = price paid" stays clean.
- **Express: offer it, customer pays,** presented as "Priority production & shipping",
  **+CHF 60-90** (recommend +CHF 69 capped at eco speed unless express orders can be
  consolidated). This is the only sanctioned exception to the all-inclusive price rule.
- **Bundle:** shirt + trouser "Complete look" at **CHF 339** (vs 358 a la carte, ~5% off); the
  discount is a slice of the shared-freight saving, so bundle margin stays ~38-39%.

## Launch / intro pricing

Recommend a **founding-customer window** (first ~50 customers or ~6 weeks) at the lower tier
(shirt CHF 149, trouser CHF 179), framed as early-access, then settle to 169/189. Do not launch
below 149/179 (erodes the premium story; margins get thin before overhead). Alternative: no
discount, add a free premium detail (monogram / free first express).

## Confirm these inputs (founder)

1. Inbound freight is per-shipment, and realistic garments/shipment at launch (assumed 4; at
   1/shipment shirt margin drops from 43% to ~23%).
2. Cotton (oxford/camp) production cost (assumed = linen $65; trouser confirmed $85).
3. Real payment mix + Shopify plan (TWINT share lifts margin).
4. Target remake rate (assumed 10%; 5% vs 15% swings margin ~5 pts).
5. Overhead + CAC (per-unit model sets overhead to CHF 0; gross margin must cover it + marketing).
6. Domestic parcel weight (CHF 9 covers <=2 kg; check a bundle stays under).

## Bottom line

Shirts CHF 169, trousers CHF 189 (VAT-inclusive); free standard shipping; premium fabric
+CHF 20-30; express +CHF 69; founding-customer window at 149/179; shirt+trouser bundle CHF 339.

Sources (accessed 2026-07-01): Bloomberg + exchange-rates.org USD/CHF; what.digital Shopify
Payments fees 2026; twint.ch business fees.
