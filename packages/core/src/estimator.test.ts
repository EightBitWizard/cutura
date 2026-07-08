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

// Field set aligned to the supplier's measurement guideline (tuongtailor.com):
// shirt = neck, shoulder, back width, above chest, armhole, biceps, wrist,
// sleeve length, shirt length (chest itself is the wizard input); trouser =
// belly, crotch, thigh, calf, trouser length (waist + hips are wizard inputs).
describe("shirt estimation (supplier field set, golden values)", () => {
  it("derives the full supplier set for a typical body", () => {
    const { derived, confidenceLevel, warnings } = estimate("shirt", normal);
    expect(derived).toEqual({
      neck: 37,
      shoulder: 50.1,
      backWidth: 44,
      aboveChest: 96,
      armhole: 46,
      biceps: 35.3,
      wrist: 16.7,
      sleeveLength: 60.3,
      shirtLength: 77.4,
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

describe("trouser estimation (supplier field set, golden values)", () => {
  it("derives the full supplier set for a typical body", () => {
    const { derived, confidenceLevel } = estimate("trouser", normal);
    expect(derived).toEqual({
      belly: 87,
      crotch: 64.8,
      thigh: 50.2,
      calf: 32.6,
      trouserLength: 110.7,
    });
    expect(confidenceLevel).toBe("high");
  });

  it("estimates a larger belly for a heavier build", () => {
    const light = (estimate("trouser", normal).derived as Partial<TrouserMeasurements>).belly;
    const heavy = (
      estimate("trouser", { ...normal, weightKg: 95 }).derived as Partial<TrouserMeasurements>
    ).belly;
    expect(heavy as number).toBeGreaterThan(light as number);
  });
});

describe("jacketEstimator (men, supplier guideline fields)", () => {
  it("derives the jacket measurement set from height/weight/chest", () => {
    const result = estimate("jacket", {
      heightCm: 180,
      weightKg: 75,
      chestCm: 100,
      waistCm: 85,
      hipsCm: 98,
      fitPreference: "regular",
    });
    expect(result.derived).toEqual({
      shoulder: 50.1,
      sleeveLength: 60.3,
      backLength: 45,
      jacketLength: 74.7,
      biceps: 35.3,
      wrist: 16.7,
    });
    expect(result.confidenceLevel).toBe("high");
  });
});

describe("jacketWomenEstimator (provisional female proportions)", () => {
  it("derives the women's jacket set from height/weight/bust", () => {
    const result = estimate("jacket_w", {
      heightCm: 168,
      weightKg: 62,
      chestCm: 92,
      waistCm: 74,
      hipsCm: 100,
      fitPreference: "regular",
    });
    expect(result.derived).toEqual({
      shoulder: 41.1,
      sleeveLength: 55.4,
      backLength: 39.5,
      jacketLength: 63.8,
      biceps: 27.7,
      wrist: 15.1,
    });
    expect(result.confidenceLevel).toBe("high");
  });
});

describe("trouserWomenEstimator (provisional female proportions)", () => {
  it("derives the women's trouser set from height/weight/waist/hips", () => {
    const result = estimate("trouser_w", {
      heightCm: 168,
      weightKg: 62,
      chestCm: 0,
      waistCm: 74,
      hipsCm: 100,
      fitPreference: "regular",
    });
    expect(result.derived).toEqual({
      belly: 75,
      crotch: 62.2,
      thigh: 58.2,
      calf: 36.7,
      trouserLength: 104.2,
    });
    expect(result.confidenceLevel).toBe("high");
  });
});
