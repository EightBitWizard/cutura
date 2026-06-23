import { describe, expect, it } from "vitest";

import { checkShirtOutliers, checkTrouserOutliers } from "./outliers";
import type { ShirtMeasurements, TrouserMeasurements } from "./types";

const validShirt: ShirtMeasurements = {
  chest: 100,
  waist: 88,
  hips: 100,
  neck: 39,
  shoulder: 46,
  sleeveLength: 64,
  shirtLength: 76,
};

const validTrouser: TrouserMeasurements = {
  waist: 88,
  hips: 100,
  inseam: 80,
  outseam: 104,
  thigh: 58,
  knee: 42,
  legOpening: 32,
  rise: 26,
};

describe("checkShirtOutliers", () => {
  it("passes a plausible shirt", () => {
    expect(checkShirtOutliers(validShirt)).toEqual({ isOutlier: false, flags: [] });
  });

  it("flags missing measurements for manual review", () => {
    const result = checkShirtOutliers(null);
    expect(result.isOutlier).toBe(true);
    expect(result.flags[0]).toContain("Keine Masse vorhanden");
  });

  it("flags an out-of-range chest", () => {
    const result = checkShirtOutliers({ ...validShirt, chest: 200 });
    expect(result.isOutlier).toBe(true);
    expect(result.flags.join(" ")).toContain("Brustumfang");
  });

  it("treats a cleared 0 value as a real out-of-range input, not as absent", () => {
    // Number("") === 0; a truthy guard would let 0 slip past the range check.
    const result = checkShirtOutliers({ ...validShirt, chest: 0 });
    expect(result.isOutlier).toBe(true);
  });

  it("flags a waist larger than the chest", () => {
    const result = checkShirtOutliers({ ...validShirt, waist: 110, chest: 100 });
    expect(result.isOutlier).toBe(true);
    expect(result.flags.join(" ")).toContain("Taillenumfang");
  });
});

describe("checkTrouserOutliers", () => {
  it("passes a plausible trouser", () => {
    expect(checkTrouserOutliers(validTrouser)).toEqual({ isOutlier: false, flags: [] });
  });

  it("flags an outseam that is not larger than the inseam", () => {
    const result = checkTrouserOutliers({ ...validTrouser, outseam: 80, inseam: 80 });
    expect(result.isOutlier).toBe(true);
    expect(result.flags.join(" ")).toContain("Aussenlänge");
  });

  it("flags a knee wider than the thigh", () => {
    const result = checkTrouserOutliers({ ...validTrouser, knee: 70, thigh: 58 });
    expect(result.isOutlier).toBe(true);
    expect(result.flags.join(" ")).toContain("Knieumfang");
  });
});
