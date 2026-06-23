import { describe, expect, it } from "vitest";

import { priceConfiguration } from "./pricing";

describe("priceConfiguration - server-authoritative gross pricing", () => {
  it("sums base, fabric, options and upgrades into a gross total", () => {
    expect(
      priceConfiguration({
        basePriceMinor: 12900,
        fabricSurchargeMinor: 2000,
        optionSurchargesMinor: [1000, 500],
        upgradePricesMinor: [1500],
      }),
    ).toEqual({ base: 12900, fabric: 2000, options: 1500, upgrades: 1500, total: 17900 });
  });

  it("handles no options or upgrades", () => {
    expect(
      priceConfiguration({
        basePriceMinor: 12900,
        fabricSurchargeMinor: 0,
        optionSurchargesMinor: [],
        upgradePricesMinor: [],
      }),
    ).toEqual({ base: 12900, fabric: 0, options: 0, upgrades: 0, total: 12900 });
  });

  it("allows a negative option surcharge to reduce the total", () => {
    const result = priceConfiguration({
      basePriceMinor: 12900,
      fabricSurchargeMinor: 0,
      optionSurchargesMinor: [-500],
      upgradePricesMinor: [],
    });
    expect(result.options).toBe(-500);
    expect(result.total).toBe(12400);
  });

  it("rejects a configuration whose total would be negative", () => {
    expect(() =>
      priceConfiguration({
        basePriceMinor: 0,
        fabricSurchargeMinor: 0,
        optionSurchargesMinor: [-100],
        upgradePricesMinor: [],
      }),
    ).toThrow();
  });
});
