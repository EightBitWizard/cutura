import { describe, expect, it } from "vitest";

import { effectiveLeadTime, isOrderingPaused, isVacationActive } from "./capacity";
import { DEFAULT_OPERATIONS_SETTINGS, type OperationsSettings } from "./operationsSettings";

const base: OperationsSettings = { ...DEFAULT_OPERATIONS_SETTINGS };
const now = new Date("2026-07-05T12:00:00.000Z");

describe("isOrderingPaused", () => {
  it("is false by default", () => {
    expect(isOrderingPaused(base, 0, now)).toBe(false);
  });

  it("is true when manually paused", () => {
    expect(isOrderingPaused({ ...base, paused: true }, 0, now)).toBe(true);
  });

  it("is true at or above the capacity cap, false below", () => {
    const s = { ...base, capacityCap: 10 };
    expect(isOrderingPaused(s, 9, now)).toBe(false);
    expect(isOrderingPaused(s, 10, now)).toBe(true);
    expect(isOrderingPaused(s, 11, now)).toBe(true);
  });

  it("is true within an active vacation window", () => {
    const s = { ...base, vacationFrom: "2026-07-01", vacationUntil: "2026-07-14" };
    expect(isOrderingPaused(s, 0, now)).toBe(true);
    expect(isOrderingPaused(s, 0, new Date("2026-08-01T00:00:00Z"))).toBe(false);
  });
});

describe("isVacationActive", () => {
  it("handles open-ended and bounded windows", () => {
    expect(isVacationActive(base, now)).toBe(false); // no window
    expect(isVacationActive({ ...base, vacationFrom: "2026-07-01" }, now)).toBe(true);
    expect(isVacationActive({ ...base, vacationUntil: "2026-07-01" }, now)).toBe(false);
    expect(
      isVacationActive({ ...base, vacationFrom: "2026-07-10", vacationUntil: "2026-07-20" }, now),
    ).toBe(false); // before start
  });
});

describe("effectiveLeadTime", () => {
  it("is unchanged with no cap", () => {
    expect(effectiveLeadTime(21, 35, 100, base)).toEqual({
      minDays: 21,
      maxDays: 35,
      extended: false,
    });
  });

  it("is unchanged below the high-water fraction", () => {
    const s = { ...base, capacityCap: 10, capacityHighWaterFraction: 0.8, leadTimeBufferDays: 7 };
    expect(effectiveLeadTime(21, 35, 7, s)).toEqual({ minDays: 21, maxDays: 35, extended: false });
  });

  it("extends by the buffer at or above the high-water fraction", () => {
    const s = { ...base, capacityCap: 10, capacityHighWaterFraction: 0.8, leadTimeBufferDays: 7 };
    expect(effectiveLeadTime(21, 35, 8, s)).toEqual({ minDays: 28, maxDays: 42, extended: true });
  });
});
