import { describe, expect, it } from "vitest";

import { checkOutliers } from "./outliers";

describe("checkOutliers (dispatch by garment type)", () => {
  it("flags an out-of-range shirt", () => {
    const r = checkOutliers("shirt", {
      neck: 39,
      shoulder: 46,
      backWidth: 44,
      aboveChest: 96,
      chest: 200,
      armhole: 46,
      biceps: 35,
      wrist: 17,
      sleeveLength: 64,
      shirtLength: 76,
    });
    expect(r.isOutlier).toBe(true);
    expect(r.flags.length).toBeGreaterThan(0);
  });

  it("passes a normal shirt", () => {
    const r = checkOutliers("shirt", {
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
    });
    expect(r.isOutlier).toBe(false);
  });

  it("dispatches to the trouser checks", () => {
    // calf > thigh is a trouser-only plausibility rule, so a flag proves dispatch.
    const r = checkOutliers("trouser", {
      waist: 88,
      belly: 92,
      hips: 100,
      crotch: 66,
      thigh: 58,
      calf: 70,
      trouserLength: 108,
    });
    expect(r.isOutlier).toBe(true);
    expect(r.flags.join(" ")).toContain("Waden");
  });
});
