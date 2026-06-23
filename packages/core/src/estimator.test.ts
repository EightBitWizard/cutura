import { afterEach, describe, expect, it } from "vitest";

import {
  EstimatorNotFoundError,
  estimate,
  getEstimator,
  registerEstimator,
  unregisterEstimator,
  type MeasurementEstimator,
} from "./estimator";
import type { TrouserMeasurements, WizardShortInput } from "./types";

const normal: WizardShortInput = {
  heightCm: 180,
  weightKg: 75,
  chestCm: 100,
  waistCm: 85,
  hipsCm: 98,
  fitPreference: "regular",
};

describe("estimator seam (swappable interface)", () => {
  afterEach(() => unregisterEstimator("test-jacket"));

  it("registers shirt and trouser modules by default", () => {
    expect(getEstimator("shirt").garmentType).toBe("shirt");
    expect(getEstimator("trouser").garmentType).toBe("trouser");
  });

  it("lets a new garment-type module plug in without code changes elsewhere", () => {
    const fake: MeasurementEstimator = {
      garmentType: "test-jacket",
      estimate: () => ({ derived: {}, confidenceLevel: "high", warnings: [] }),
    };
    registerEstimator(fake);
    expect(getEstimator("test-jacket")).toBe(fake);
  });

  it("throws a typed error for an unknown garment type", () => {
    expect(() => getEstimator("unknown")).toThrow(EstimatorNotFoundError);
    expect(() => estimate("unknown", normal)).toThrow(EstimatorNotFoundError);
  });
});

describe("shirt estimation (ported formulas, golden values)", () => {
  it("derives the full set for a typical body", () => {
    const { derived, confidenceLevel, warnings } = estimate("shirt", normal);
    expect(derived).toEqual({
      neck: 37,
      shoulder: 50.1,
      sleeveLength: 60.3,
      shirtLength: 77.4,
      bicepCircumference: 35.3,
      wristCircumference: 16.7,
    });
    expect(confidenceLevel).toBe("high");
    expect(warnings).toEqual([]);
  });

  it("returns low confidence and no derived values for invalid input", () => {
    const result = estimate("shirt", { ...normal, heightCm: 0 });
    expect(result.confidenceLevel).toBe("low");
    expect(result.derived).toEqual({});
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("returns medium confidence for an unusual but valid build", () => {
    const result = estimate("shirt", {
      ...normal,
      weightKg: 95,
      chestCm: 110,
      waistCm: 92,
    });
    expect(result.confidenceLevel).toBe("medium");
  });
});

describe("trouser estimation (ported formulas, golden values)", () => {
  it("derives the full set for a typical body", () => {
    const { derived, confidenceLevel } = estimate("trouser", normal);
    expect(derived).toEqual({
      inseam: 82.8,
      rise: 27.9,
      outseam: 110.7,
      thigh: 50.2,
      knee: 36.1,
      legOpening: 27.1,
    });
    expect(confidenceLevel).toBe("high");
  });

  it("widens the leg opening for a relaxed fit", () => {
    const slim = (
      estimate("trouser", { ...normal, fitPreference: "slim" })
        .derived as Partial<TrouserMeasurements>
    ).legOpening;
    const relaxed = (
      estimate("trouser", { ...normal, fitPreference: "relaxed" })
        .derived as Partial<TrouserMeasurements>
    ).legOpening;
    expect(relaxed as number).toBeGreaterThan(slim as number);
  });
});
