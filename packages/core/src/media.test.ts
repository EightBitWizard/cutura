import { describe, expect, it } from "vitest";

import { isAllowedImageType } from "./media";

describe("isAllowedImageType", () => {
  it("accepts raster image types", () => {
    for (const t of ["image/png", "image/jpeg", "image/webp", "image/gif"]) {
      expect(isAllowedImageType(t)).toBe(true);
    }
  });

  it("rejects SVG, HTML, and anything that can carry script", () => {
    for (const t of ["image/svg+xml", "text/html", "application/xml", "", null, undefined]) {
      expect(isAllowedImageType(t)).toBe(false);
    }
  });
});
