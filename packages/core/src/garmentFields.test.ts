import { describe, expect, it } from "vitest";

import { garmentFields, wizardBaseFields } from "./garmentFields";

// Field sets follow the supplier's measurement guideline (tuongtailor.com), so the
// form, the review screen, and the production spec collect exactly what the tailor
// works with.
describe("garmentFields", () => {
  it("returns the ordered shirt confirmed fields (supplier guideline)", () => {
    expect(garmentFields("shirt")).toEqual([
      "neck",
      "shoulder",
      "backWidth",
      "aboveChest",
      "chest",
      "armhole",
      "biceps",
      "wrist",
      "sleeveLength",
      "shirtLength",
    ]);
  });

  it("returns the ordered trouser confirmed fields (supplier guideline)", () => {
    expect(garmentFields("trouser")).toEqual([
      "waist",
      "belly",
      "hips",
      "crotch",
      "thigh",
      "calf",
      "trouserLength",
    ]);
  });

  it("defaults an unknown garment type to shirt fields", () => {
    expect(garmentFields("unknown")).toEqual(garmentFields("shirt"));
  });
});

describe("wizardBaseFields", () => {
  it("is the customer-entered base inputs per type, always a subset of the confirmed fields", () => {
    expect(wizardBaseFields("shirt")).toEqual(["chest"]);
    expect(wizardBaseFields("trouser")).toEqual(["waist", "hips"]);
    for (const gt of ["shirt", "trouser"]) {
      for (const base of wizardBaseFields(gt)) {
        expect(garmentFields(gt)).toContain(base);
      }
    }
  });
});

describe("jacket + women garment types", () => {
  it("returns the supplier jacket field order for men and women", () => {
    const expected = [
      "chest",
      "waist",
      "hips",
      "shoulder",
      "sleeveLength",
      "backLength",
      "jacketLength",
      "biceps",
      "wrist",
    ];
    expect(garmentFields("jacket")).toEqual(expected);
    expect(garmentFields("jacket_w")).toEqual(expected);
  });

  it("women's trousers use the trouser field set", () => {
    expect(garmentFields("trouser_w")).toEqual(garmentFields("trouser"));
  });

  it("jacket wizard asks for chest, waist, and hips; women's trousers for waist and hips", () => {
    expect(wizardBaseFields("jacket")).toEqual(["chest", "waist", "hips"]);
    expect(wizardBaseFields("jacket_w")).toEqual(["chest", "waist", "hips"]);
    expect(wizardBaseFields("trouser_w")).toEqual(["waist", "hips"]);
  });
});
