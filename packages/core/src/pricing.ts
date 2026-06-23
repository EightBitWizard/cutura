// Server-authoritative pricing engine. A pure function from catalog price
// components to an itemized gross breakdown and total, in minor units (Rappen).
// Prices are gross (VAT inclusive). The client never sends a price; the server
// computes it here at add-to-cart and recomputes at checkout (REQUIREMENTS.md
// E1 US-1.6, E4 US-4.4; FR-150 to FR-152, FR-411, FR-412). Standard shipping is
// added at the order level by the owned shipping config, not here.

export interface PriceComponents {
  /** Base model price, gross minor units. */
  basePriceMinor: number;
  /** Fabric surcharge, gross minor units. */
  fabricSurchargeMinor: number;
  /** Per-option surcharges, gross minor units. A value may be negative. */
  optionSurchargesMinor: number[];
  /** Per-upgrade prices, gross minor units. */
  upgradePricesMinor: number[];
}

export interface PriceBreakdown {
  base: number;
  fabric: number;
  /** Sum of option surcharges. */
  options: number;
  /** Sum of upgrade prices. */
  upgrades: number;
  /** Gross configured total in minor units. */
  total: number;
}

const sum = (values: number[]): number => values.reduce((acc, v) => acc + v, 0);

export function priceConfiguration(components: PriceComponents): PriceBreakdown {
  const options = sum(components.optionSurchargesMinor);
  const upgrades = sum(components.upgradePricesMinor);
  const total = components.basePriceMinor + components.fabricSurchargeMinor + options + upgrades;

  if (total < 0) {
    throw new RangeError("Configured price total cannot be negative.");
  }

  return {
    base: components.basePriceMinor,
    fabric: components.fabricSurchargeMinor,
    options,
    upgrades,
    total,
  };
}
