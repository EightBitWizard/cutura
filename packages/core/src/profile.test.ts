import { describe, expect, it } from "vitest";

import {
  createProfileVersion,
  effectiveProfileMeasurements,
  reviseConfirmedValues,
} from "./profile";
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

describe("three-layer measurement profile versioning", () => {
  it("creates an initial version with no predecessor", () => {
    const v1 = createProfileVersion({
      method: "wizard",
      originalInputs: { chest: 100 },
      derivedValues: { neck: 39 },
      confirmedValues: confirmed,
      createdAt: "2026-06-23T00:00:00Z",
    });
    expect(v1.version).toBe(1);
    expect(v1.previousVersion).toBeNull();
    expect(effectiveProfileMeasurements(v1)).toEqual(confirmed);
  });

  it("revises confirmed values into a new version without mutating the previous", () => {
    const v1 = createProfileVersion({
      method: "wizard",
      originalInputs: {},
      derivedValues: {},
      confirmedValues: { ...confirmed },
      createdAt: "t1",
    });
    const v2 = reviseConfirmedValues(v1, { chest: 102 }, "t2");
    expect(v2.version).toBe(2);
    expect(v2.previousVersion).toBe(1);
    expect((v2.confirmedValues as ShirtMeasurements).chest).toBe(102);
    expect((v1.confirmedValues as ShirtMeasurements).chest).toBe(100);
  });

  it("never lets confirmed values change silently (the version is frozen)", () => {
    const v1 = createProfileVersion({
      method: "detailed",
      originalInputs: {},
      derivedValues: {},
      confirmedValues: { ...confirmed },
      createdAt: "t1",
    });
    expect(() => {
      (v1.confirmedValues as ShirtMeasurements).chest = 999;
    }).toThrow();
  });

  it("chains versions across successive revisions", () => {
    const v1 = createProfileVersion({
      method: "wizard",
      originalInputs: {},
      derivedValues: {},
      confirmedValues: { ...confirmed },
      createdAt: "t1",
    });
    const v3 = reviseConfirmedValues(
      reviseConfirmedValues(v1, { chest: 102 }, "t2"),
      { chest: 103 },
      "t3",
    );
    expect(v3.version).toBe(3);
    expect(v3.previousVersion).toBe(2);
    expect((v3.confirmedValues as ShirtMeasurements).chest).toBe(103);
  });
});

describe("explicit garment type on versions", () => {
  it("createProfileVersion carries the explicit garment type", () => {
    const v = createProfileVersion({
      method: "detailed",
      garmentType: "jacket_w",
      originalInputs: {},
      derivedValues: {},
      confirmedValues: { chest: 92 } as never,
      createdAt: "t1",
    });
    expect(v.garmentType).toBe("jacket_w");
  });

  it("reviseConfirmedValues preserves the garment type", () => {
    const v1 = createProfileVersion({
      method: "detailed",
      garmentType: "trouser_w",
      originalInputs: {},
      derivedValues: {},
      confirmedValues: { waist: 74 } as never,
      createdAt: "t1",
    });
    const v2 = reviseConfirmedValues(v1, { waist: 75 }, "t2");
    expect(v2.garmentType).toBe("trouser_w");
  });
});
