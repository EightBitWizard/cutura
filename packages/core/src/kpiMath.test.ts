import { describe, expect, it } from "vitest";

import { averageDays, marginMinor, rate } from "./kpiMath";

describe("kpiMath", () => {
  it("rate guards division by zero", () => {
    expect(rate(2, 4)).toBe(0.5);
    expect(rate(1, 0)).toBe(0);
    expect(rate(0, 0)).toBe(0);
  });

  it("marginMinor subtracts the cost parts, treating null as 0", () => {
    expect(marginMinor(10000, { fabricMinor: 3000, productionMinor: 2000 })).toBe(5000);
    expect(
      marginMinor(10000, {
        fabricMinor: null,
        productionMinor: null,
        inboundMinor: null,
        feesMinor: null,
      }),
    ).toBe(10000);
  });

  it("averageDays returns null for empty, days otherwise", () => {
    expect(averageDays([])).toBeNull();
    expect(averageDays([86400000 * 2, 86400000 * 4])).toBe(3);
  });
});
