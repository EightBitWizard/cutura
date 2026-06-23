import { describe, expect, it } from "vitest";

import { MEASUREMENT_FIELD_LABELS_DE, inferGarmentType } from "./garment";

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
