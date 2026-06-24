import { describe, expect, it } from "vitest";

import { buildAlternates } from "./seo";

const SUPPORTED = ["de", "en", "it", "fr"] as const;

describe("buildAlternates", () => {
  it("builds canonical + hreflang languages incl. x-default", () => {
    const a = buildAlternates("/products/x", "en", SUPPORTED, "de");
    expect(a.canonical).toBe("/en/products/x");
    expect(a.languages.de).toBe("/de/products/x");
    expect(a.languages.fr).toBe("/fr/products/x");
    expect(a.languages["x-default"]).toBe("/de/products/x");
  });

  it("handles the root path", () => {
    const a = buildAlternates("/", "de", SUPPORTED, "de");
    expect(a.canonical).toBe("/de");
    expect(a.languages.en).toBe("/en");
  });
});
