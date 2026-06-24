import { describe, expect, it } from "vitest";

import { localize } from "./read";

describe("localize", () => {
  it("returns the requested locale when present", () => {
    expect(localize({ de: "Hemd", en: "Shirt" }, "en")).toBe("Shirt");
  });

  it("falls back to German when the locale is missing", () => {
    expect(localize({ de: "Hemd" }, "fr")).toBe("Hemd");
  });

  it("returns empty string for null/undefined", () => {
    expect(localize(null, "de")).toBe("");
    expect(localize(undefined, "en")).toBe("");
  });
});
