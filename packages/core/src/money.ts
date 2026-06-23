// Money and VAT helpers. All amounts are integer minor units (Rappen). The price
// shown to the customer is gross (VAT inclusive) and all-inclusive; VAT is never
// added on top and never shown as a customer choice. Shopify records VAT tax
// inclusive on the draft order, so these helpers serve confirmations and the
// later VAT invoice. See REQUIREMENTS.md E7 US-7.3 and CLAUDE.md product rules.

/** Swiss standard VAT rate in basis points (8.1%). */
export const SWISS_STANDARD_VAT_BPS = 810;

export interface VatBreakdown {
  /** Gross amount in Rappen (the price paid). */
  gross: number;
  /** Net amount in Rappen, VAT extracted from inside the gross. */
  net: number;
  /** VAT amount in Rappen. */
  vat: number;
}

/**
 * Extract VAT from a gross, inclusive amount. net + vat always equals gross.
 * Rounded to whole Rappen. bps defaults to the Swiss standard rate.
 */
export function vatBreakdown(
  grossMinor: number,
  bps: number = SWISS_STANDARD_VAT_BPS,
): VatBreakdown {
  const net = Math.round((grossMinor * 10000) / (10000 + bps));
  return { gross: grossMinor, net, vat: grossMinor - net };
}

/**
 * Format minor units as Swiss francs, e.g. 1234567 -> "CHF 12'345.67". Thousands
 * are grouped with an apostrophe (Swiss convention) and always two decimals.
 * Deterministic and independent of the host ICU data.
 */
export function formatCHF(minorUnits: number): string {
  const negative = minorUnits < 0;
  const abs = Math.abs(minorUnits);
  const francs = Math.trunc(abs / 100);
  const rappen = abs % 100;
  const grouped = francs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  const cents = rappen.toString().padStart(2, "0");
  return `${negative ? "-" : ""}CHF ${grouped}.${cents}`;
}
