import type { OperationsSettings } from "./operationsSettings";

// Capacity + pause logic (FR-2B0/2B1, FR-10D0). Pure; the storefront supplies the
// open-order count and "now", and gates add-to-cart + checkout on the result.

/** Within the configured vacation window (open-ended if either bound is null). */
export function isVacationActive(settings: OperationsSettings, now: Date): boolean {
  const from = settings.vacationFrom ? Date.parse(settings.vacationFrom) : null;
  const until = settings.vacationUntil ? Date.parse(settings.vacationUntil) : null;
  if (from === null && until === null) return false;
  const t = now.getTime();
  if (from !== null) {
    if (Number.isNaN(from) || t < from) return false;
  }
  if (until !== null) {
    if (Number.isNaN(until) || t > until) return false;
  }
  return true;
}

/** New orders pause on the manual toggle, an active vacation, or reaching the capacity cap. */
export function isOrderingPaused(
  settings: OperationsSettings,
  openOrderCount: number,
  now: Date,
): boolean {
  if (settings.paused) return true;
  if (isVacationActive(settings, now)) return true;
  if (settings.capacityCap !== null && openOrderCount >= settings.capacityCap) return true;
  return false;
}

export interface LeadTimeRange {
  minDays: number;
  maxDays: number;
  extended: boolean;
}

/**
 * Lead-time bounds, extended by the buffer once open load crosses the high-water
 * fraction of the cap (FR-10D0). Honest range, never a guaranteed date.
 */
export function effectiveLeadTime(
  minDays: number,
  maxDays: number,
  openOrderCount: number,
  settings: OperationsSettings,
): LeadTimeRange {
  const cap = settings.capacityCap;
  if (cap === null || cap <= 0) return { minDays, maxDays, extended: false };
  if (openOrderCount / cap >= settings.capacityHighWaterFraction) {
    return {
      minDays: minDays + settings.leadTimeBufferDays,
      maxDays: maxDays + settings.leadTimeBufferDays,
      extended: true,
    };
  }
  return { minDays, maxDays, extended: false };
}
