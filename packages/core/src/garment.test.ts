import { describe, expect, it } from "vitest";

import { MEASUREMENT_FIELD_LABELS_DE, inferGarmentType, normalizeGarmentType } from "./garment";

describe("inferGarmentType", () => {
  it("defaults to shirt for empty or missing measurements", () => {
    expect(inferGarmentType(null)).toBe("shirt");
    expect(inferGarmentType({})).toBe("shirt");
  });

  it("detects a trouser by a trouser-only field", () => {
    expect(inferGarmentType({ inseam: 80 })).toBe("trouser");
  });

  it("treats a shirt-shaped object as a shirt", () => {
    expect(inferGarmentType({ chest: 100, neck: 39 })).toBe("shirt");
  });
});

describe("MEASUREMENT_FIELD_LABELS_DE", () => {
  it("labels the core fields in German", () => {
    expect(MEASUREMENT_FIELD_LABELS_DE.chest).toBe("Brustumfang");
    expect(MEASUREMENT_FIELD_LABELS_DE.inseam).toBe("Schrittlänge");
  });
});

describe("normalizeGarmentType", () => {
  it("passes through every known garment type", () => {
    for (const t of ["shirt", "trouser", "jacket", "jacket_w", "trouser_w"]) {
      expect(normalizeGarmentType(t)).toBe(t);
    }
  });

  it("falls back to shirt for unknown or missing values", () => {
    expect(normalizeGarmentType("hoodie")).toBe("shirt");
    expect(normalizeGarmentType(undefined)).toBe("shirt");
    expect(normalizeGarmentType(null)).toBe("shirt");
    expect(normalizeGarmentType(42)).toBe("shirt");
  });
});

describe("inferGarmentType jacket fallback", () => {
  it("recognizes jacket-only keys in historic snapshots", () => {
    expect(inferGarmentType({ chest: 100, backLength: 45, jacketLength: 75 })).toBe("jacket");
  });
});
