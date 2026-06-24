import { describe, expect, it } from "vitest";

import { renderParcelCardPdf } from "./parcelCardPdf";

describe("renderParcelCardPdf", () => {
  it("produces a non-empty PDF for each locale", async () => {
    for (const locale of ["de", "en", "it", "fr"] as const) {
      const bytes = await renderParcelCardPdf({
        orderNumber: "CUT-TEST",
        garmentType: "shirt",
        locale,
        fibreComposition: "100% Cotton",
      });
      expect(bytes.length).toBeGreaterThan(100);
      // PDF magic header "%PDF".
      expect([bytes[0], bytes[1], bytes[2], bytes[3]]).toEqual([0x25, 0x50, 0x44, 0x46]);
    }
  });
});
