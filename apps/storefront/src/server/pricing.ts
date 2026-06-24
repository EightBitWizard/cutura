// Server-authoritative configuration pricing. The client sends only selection
// codes; every charged amount is resolved here from the freshly-read published
// catalog and computed by the pure core priceConfiguration. This single resolver
// backs /api/price (live display), /api/cart (recompute on add), and
// /api/checkout (recompute before the draft order, FR-7J0). The client price is
// never trusted (FR-412).

import { type PriceBreakdown, priceConfiguration } from "@cutura/core";
import { type Database, type PublishedModelDetail, getPublishedModel } from "@cutura/db";

import type { Locale } from "@/i18n/config";

export interface Selection {
  fabricCode: string | null;
  optionValueCodes: string[];
  upgradeCodes: string[];
}

export interface ResolvedOption {
  groupCode: string;
  valueCode: string;
  label: string;
  surchargeMinor: number;
}

export interface PricedConfiguration {
  model: PublishedModelDetail;
  breakdown: PriceBreakdown;
  /** Complete + orderable: a fabric is chosen (if any exist) and every required group is satisfied. */
  valid: boolean;
  /** Codes of required option groups not yet chosen. */
  missingRequired: string[];
  fabric: { code: string; name: string; surchargeMinor: number } | null;
  options: ResolvedOption[];
  upgrades: Array<{ code: string; name: string; priceMinor: number; placement: string | null }>;
}

/**
 * Resolve a selection against the current published catalog and price it.
 * Returns null if the model is missing or not orderable. Unknown / withdrawn /
 * unavailable codes are silently dropped (they are absent from the published
 * model), so they cannot inflate or deflate the price.
 */
export async function priceConfigured(
  db: Database,
  handle: string,
  locale: Locale,
  selection: Selection,
): Promise<PricedConfiguration | null> {
  const model = await getPublishedModel(db, handle, locale);
  if (!model || model.status !== "orderable") return null;

  // model.fabrics is already filtered to available fabrics in allow-list order.
  const fabric = model.fabrics.find((f) => f.code === selection.fabricCode) ?? null;

  const options: ResolvedOption[] = [];
  for (const group of model.optionGroups) {
    for (const value of group.values) {
      if (selection.optionValueCodes.includes(value.code)) {
        options.push({
          groupCode: group.code,
          valueCode: value.code,
          label: value.label,
          surchargeMinor: value.surchargeMinor,
        });
      }
    }
  }

  const upgrades = model.upgrades.filter((u) => selection.upgradeCodes.includes(u.code));

  const breakdown = priceConfiguration({
    basePriceMinor: model.basePriceMinor,
    fabricSurchargeMinor: fabric?.surchargeMinor ?? 0,
    optionSurchargesMinor: options.map((o) => o.surchargeMinor),
    upgradePricesMinor: upgrades.map((u) => u.priceMinor),
  });

  const missingRequired = model.optionGroups
    .filter((g) => g.required && !g.values.some((v) => selection.optionValueCodes.includes(v.code)))
    .map((g) => g.code);

  const valid = missingRequired.length === 0 && (model.fabrics.length === 0 || fabric !== null);

  return {
    model,
    breakdown,
    valid,
    missingRequired,
    fabric: fabric
      ? { code: fabric.code, name: fabric.name, surchargeMinor: fabric.surchargeMinor }
      : null,
    options,
    upgrades,
  };
}
