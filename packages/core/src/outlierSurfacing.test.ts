import { describe, expect, it } from "vitest";

import { checkOutliers } from "./outliers";

describe("checkOutliers (dispatch by garment type)", () => {
  it("flags an out-of-range shirt", () => {
    const r = checkOutliers("shirt", {
      chest: 200,
      waist: 88,
      hips: 96,
      neck: 40,
      shoulder: 46,
      sleeveLength: 64,
      shirtLength: 76,
    });
    expect(r.isOutlier).toBe(true);
    expect(r.flags.length).toBeGreaterThan(0);
  });

  it("passes a normal shirt", () => {
    const r = checkOutliers("shirt", {
      chest: 100,
      waist: 88,
      hips: 96,
      neck: 40,
      shoulder: 46,
      sleeveLength: 64,
      shirtLength: 76,
    });
    expect(r.isOutlier).toBe(false);
  });

  it("dispatches to the trouser checks", () => {
    const r = checkOutliers("trouser", {
      waist: 200,
      hips: 96,
      inseam: 80,
      outseam: 100,
      thigh: 60,
    });
    expect(r.isOutlier).toBe(true);
  });
});
