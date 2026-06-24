import { describe, expect, it } from "vitest";

import { buildProductJsonLd } from "./productJsonLd";

describe("buildProductJsonLd", () => {
  it("builds Product + Offer with the all-inclusive price", () => {
    const ld = buildProductJsonLd({
      name: "Oxford White",
      description: "Crisp cotton",
      priceMinor: 12900,
      currency: "CHF",
      availability: "InStock",
    });
    expect(ld["@type"]).toBe("Product");
    expect(ld.name).toBe("Oxford White");
    const offers = ld.offers as Record<string, unknown>;
    expect(offers.price).toBe("129.00");
    expect(offers.priceCurrency).toBe("CHF");
    expect(offers.availability).toBe("https://schema.org/InStock");
  });

  it("omits description + image when absent", () => {
    const ld = buildProductJsonLd({
      name: "X",
      priceMinor: 100,
      currency: "CHF",
      availability: "PreOrder",
    });
    expect("description" in ld).toBe(false);
    expect("image" in ld).toBe(false);
  });
});
