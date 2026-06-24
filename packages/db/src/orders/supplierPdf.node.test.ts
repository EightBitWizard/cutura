import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

import { buildOrderSnapshot, buildSupplierSpec } from "@cutura/core";

import { type PdfImageFetcher, renderSupplierPdf } from "./supplierPdf";

const snapshot = buildOrderSnapshot({
  baseModelName: "Oxford White",
  fabricCode: "oxf-white",
  configuration: { collar: "kent" },
  upgrades: [{ code: "monogram", placement: "cuff", priceMinor: 1500 }],
  garmentType: "shirt",
  measurementMethod: "wizard",
  measurementProfileVersion: 1,
  confirmedValues: {
    chest: 100,
    waist: 88,
    hips: 96,
    neck: 40,
    shoulder: 46,
    sleeveLength: 64,
    shirtLength: 76,
  },
  price: { base: 12900, fabric: 0, options: 0, upgrades: 1500, total: 14400 },
  createdAt: "2026-06-24T10:00:00.000Z",
});

const nullFetcher: PdfImageFetcher = {
  async get() {
    return null;
  },
};

function header(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes.slice(0, 5));
}

describe("renderSupplierPdf", () => {
  it("produces a valid, loadable PDF", async () => {
    const bytes = await renderSupplierPdf(buildSupplierSpec(snapshot), nullFetcher);
    expect(header(bytes)).toBe("%PDF-");
    const reloaded = await PDFDocument.load(bytes);
    expect(reloaded.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it("renders a placeholder for a missing image without throwing", async () => {
    const spec = buildSupplierSpec(snapshot, {
      images: [{ r2Key: "media/model/missing", caption: "Model" }],
    });
    const bytes = await renderSupplierPdf(spec, nullFetcher);
    expect(header(bytes)).toBe("%PDF-");
  });
});
