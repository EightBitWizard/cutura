import { describe, expect, it } from "vitest";

import { SWISS_STANDARD_VAT_BPS, formatCHF, vatBreakdown } from "./money";

describe("formatCHF", () => {
  it("formats minor units (Rappen) as Swiss francs", () => {
    expect(formatCHF(10810)).toBe("CHF 108.10");
    expect(formatCHF(0)).toBe("CHF 0.00");
    expect(formatCHF(12900)).toBe("CHF 129.00");
  });

  it("groups thousands with an apostrophe (Swiss convention)", () => {
    expect(formatCHF(123456789)).toBe("CHF 1'234'567.89");
  });
});

describe("vatBreakdown - VAT extracted from a gross, inclusive price", () => {
  it("uses 8.1% as the Swiss standard rate", () => {
    expect(SWISS_STANDARD_VAT_BPS).toBe(810);
  });

  it("splits a gross amount into net and VAT", () => {
    expect(vatBreakdown(10810)).toEqual({ gross: 10810, net: 10000, vat: 810 });
  });

  it("always keeps gross equal to net plus vat", () => {
    const { gross, net, vat } = vatBreakdown(17900);
    expect(net + vat).toBe(gross);
  });
});
