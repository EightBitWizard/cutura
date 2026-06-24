import { describe, expect, it } from "vitest";

import { garmentFields, wizardBaseFields } from "./garmentFields";

describe("garmentFields", () => {
  it("returns the ordered shirt confirmed fields", () => {
    expect(garmentFields("shirt")).toEqual([
      "chest",
      "waist",
      "hips",
      "neck",
      "shoulder",
      "sleeveLength",
      "shirtLength",
    ]);
  });

  it("returns the ordered trouser confirmed fields", () => {
    expect(garmentFields("trouser")).toEqual([
      "waist",
      "hips",
      "inseam",
      "outseam",
      "thigh",
      "knee",
      "legOpening",
      "rise",
    ]);
  });

  it("defaults an unknown garment type to shirt fields", () => {
    expect(garmentFields("unknown")).toEqual(garmentFields("shirt"));
  });
});

describe("wizardBaseFields", () => {
  it("is the customer-entered base inputs per type (chest dropped for trousers)", () => {
    expect(wizardBaseFields("shirt")).toEqual(["chest", "waist", "hips"]);
    expect(wizardBaseFields("trouser")).toEqual(["waist", "hips"]);
  });
});
