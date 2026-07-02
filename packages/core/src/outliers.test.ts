import { describe, expect, it } from "vitest";

import { checkShirtOutliers, checkTrouserOutliers } from "./outliers";
import type { ShirtMeasurements, TrouserMeasurements } from "./types";

// Field sets aligned to the supplier's measurement guideline (tuongtailor.com).
const validShirt: ShirtMeasurements = {
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

const validTrouser: TrouserMeasurements = {
  waist: 88,
  belly: 92,
  hips: 100,
  crotch: 66,
  thigh: 58,
  calf: 38,
  trouserLength: 108,
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

  it("flags an above-chest larger than the chest", () => {
    const result = checkShirtOutliers({ ...validShirt, aboveChest: 106, chest: 100 });
    expect(result.isOutlier).toBe(true);
    expect(result.flags.join(" ")).toContain("Oberbrustumfang");
  });

  it("flags an out-of-range armhole and wrist", () => {
    const armhole = checkShirtOutliers({ ...validShirt, armhole: 20 });
    expect(armhole.isOutlier).toBe(true);
    expect(armhole.flags.join(" ")).toContain("Armloch");
    const wrist = checkShirtOutliers({ ...validShirt, wrist: 40 });
    expect(wrist.isOutlier).toBe(true);
    expect(wrist.flags.join(" ")).toContain("Handgelenk");
  });
});

describe("checkTrouserOutliers", () => {
  it("passes a plausible trouser", () => {
    expect(checkTrouserOutliers(validTrouser)).toEqual({ isOutlier: false, flags: [] });
  });

  it("flags a waist much larger than the hips", () => {
    const result = checkTrouserOutliers({ ...validTrouser, waist: 115, hips: 100 });
    expect(result.isOutlier).toBe(true);
    expect(result.flags.join(" ")).toContain("Taillenumfang");
  });

  it("flags a calf wider than the thigh", () => {
    const result = checkTrouserOutliers({ ...validTrouser, calf: 70, thigh: 58 });
    expect(result.isOutlier).toBe(true);
    expect(result.flags.join(" ")).toContain("Waden");
  });

  it("flags an out-of-range trouser length and crotch", () => {
    const length = checkTrouserOutliers({ ...validTrouser, trouserLength: 60 });
    expect(length.isOutlier).toBe(true);
    expect(length.flags.join(" ")).toContain("Hosenlänge");
    const crotch = checkTrouserOutliers({ ...validTrouser, crotch: 20 });
    expect(crotch.isOutlier).toBe(true);
    expect(crotch.flags.join(" ")).toContain("Schrittbogen");
  });
});
