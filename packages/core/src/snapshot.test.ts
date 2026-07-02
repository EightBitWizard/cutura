import { describe, expect, it } from "vitest";

import { applyOverride, buildOrderSnapshot } from "./snapshot";
import type { ShirtMeasurements } from "./types";

const confirmed: ShirtMeasurements = {
  neck: 39,
  shoulder: 46,
  backWidth: 44,
  aboveChest: 96,
  chest: 100,
  armhole: 46,
  biceps: 35,
  wrist: 17,
  sleeveLength: 64,
  shirtLength: 76,
};

const price = { base: 12900, fabric: 2000, options: 0, upgrades: 0, total: 14900 };

describe("applyOverride - per-piece fine tuning", () => {
  it("adds the per-field delta without mutating the source profile", () => {
    const effective = applyOverride(confirmed, { chest: 0.5 }) as ShirtMeasurements;
    expect(effective.chest).toBe(100.5);
    expect(confirmed.chest).toBe(100);
  });

  it("returns a fresh copy when there is no override", () => {
    const effective = applyOverride(confirmed);
    expect(effective).toEqual(confirmed);
    expect(effective).not.toBe(confirmed);
  });
});

describe("buildOrderSnapshot - immutable, written once", () => {
  const base = {
    baseModelName: "Oxford Business",
    fabricCode: "OXF-WHT-01",
    configuration: { collar: "spread", cuff: "barrel" },
    upgrades: [{ code: "extra-pocket", placement: "left-chest", priceMinor: 1500 }],
    garmentType: "shirt",
    measurementMethod: "wizard" as const,
    measurementProfileVersion: 1,
    confirmedValues: confirmed,
    price,
    createdAt: "2026-06-23T00:00:00Z",
  };

  it("freezes the effective values (profile plus override) into the snapshot", () => {
    const snap = buildOrderSnapshot({ ...base, override: { sleeveLength: -0.5 } });
    expect((snap.effectiveMeasurements as ShirtMeasurements).sleeveLength).toBe(63.5);
    expect(Object.isFrozen(snap)).toBe(true);
    expect(() => {
      (snap as { createdAt: string }).createdAt = "tampered";
    }).toThrow();
    expect(() => {
      (snap.configuration as Record<string, string>).collar = "tampered";
    }).toThrow();
  });

  it("does not change the source profile when an override is applied", () => {
    buildOrderSnapshot({ ...base, override: { chest: 2 } });
    expect(confirmed.chest).toBe(100);
  });
});
