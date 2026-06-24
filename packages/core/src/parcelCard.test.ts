import { describe, expect, it } from "vitest";

import { parcelCardContent } from "./parcelCard";

describe("parcelCardContent", () => {
  it("provides localized content in all four languages", () => {
    for (const l of ["de", "en", "it", "fr"] as const) {
      const c = parcelCardContent(l);
      expect(c.greeting.length).toBeGreaterThan(0);
      expect(c.careHeading.length).toBeGreaterThan(0);
      expect(c.careBody.length).toBeGreaterThan(0);
      expect(c.thanks.length).toBeGreaterThan(0);
    }
  });

  it("falls back to German for an unknown locale", () => {
    // @ts-expect-error testing fallback
    expect(parcelCardContent("es")).toEqual(parcelCardContent("de"));
  });
});
