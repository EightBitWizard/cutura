import { describe, expect, it } from "vitest";

import { incompleteLocales } from "./index";

describe("incompleteLocales", () => {
  it("returns none when all four locales are present", () => {
    expect(incompleteLocales({ de: "a", en: "b", it: "c", fr: "d" })).toEqual([]);
  });

  it("returns the missing locales", () => {
    expect(incompleteLocales({ de: "a" })).toEqual(["en", "it", "fr"]);
  });

  it("treats blank values as missing", () => {
    expect(incompleteLocales({ de: "a", en: "   " })).toEqual(["en", "it", "fr"]);
  });

  it("returns all locales for null/undefined", () => {
    expect(incompleteLocales(null)).toEqual(["de", "en", "it", "fr"]);
    expect(incompleteLocales(undefined)).toEqual(["de", "en", "it", "fr"]);
  });
});
