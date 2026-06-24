// Pure KPI math (FR-1090, FR-10A0). The DB layer gathers counts/rows; these keep
// the arithmetic deterministic + tested.

/** Safe ratio, 0 when the denominator is 0. */
export function rate(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

export interface CostParts {
  fabricMinor?: number | null;
  productionMinor?: number | null;
  inboundMinor?: number | null;
  feesMinor?: number | null;
}

/** Margin in minor units = total minus the captured cost parts (null treated as 0). */
export function marginMinor(totalMinor: number, cost: CostParts): number {
  const sum =
    (cost.fabricMinor ?? 0) +
    (cost.productionMinor ?? 0) +
    (cost.inboundMinor ?? 0) +
    (cost.feesMinor ?? 0);
  return totalMinor - sum;
}

/** Average of a list of millisecond durations expressed in days, or null if empty. */
export function averageDays(durationsMs: number[]): number | null {
  if (durationsMs.length === 0) return null;
  const avgMs = durationsMs.reduce((a, b) => a + b, 0) / durationsMs.length;
  return avgMs / 86400000;
}
