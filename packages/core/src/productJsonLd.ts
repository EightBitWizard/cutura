// Product structured data (NFR-20). Pure builder; the PDP renders the result as a
// JSON-LD script. Price is the all-inclusive consumer price (minor units -> major).

export interface ProductJsonLdInput {
  name: string;
  description?: string;
  priceMinor: number;
  currency: string;
  availability: "InStock" | "PreOrder" | "OutOfStock";
  url?: string;
  image?: string;
}

export function buildProductJsonLd(input: ProductJsonLdInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: input.image } : {}),
    ...(input.url ? { url: input.url } : {}),
    offers: {
      "@type": "Offer",
      price: (input.priceMinor / 100).toFixed(2),
      priceCurrency: input.currency,
      availability: `https://schema.org/${input.availability}`,
    },
  };
}
