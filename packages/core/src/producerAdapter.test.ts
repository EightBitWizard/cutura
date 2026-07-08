import { describe, expect, it } from "vitest";

import {
  buildKutetailorApiPayload,
  buildProducerOrderSheet,
  parseSupplierCapabilities,
  renderProducerOrderSheetText,
} from "./producerAdapter";
import type { SupplierSpec } from "./supplierSpec";

const spec: SupplierSpec = {
  garmentType: "shirt",
  baseModelName: "Oxford Business Shirt",
  fabricCode: "oxf-white",
  configuration: [
    { key: "collar", value: "kent" },
    { key: "cuff", value: "barrel" },
  ],
  upgrades: [{ code: "monogram", placement: "cuff", price: "CHF 15.00" }],
  measurements: [
    { field: "neck", label: "Halsumfang", value: 39 },
    { field: "chest", label: "Brustumfang", value: 100 },
    { field: "sleeveLength", label: "Armlänge", value: 64 },
  ],
  label: { composition: "100% Baumwolle", care: "30C" },
  images: [{ r2Key: "media/model.png", caption: "Modell" }],
};

const fullMapping = {
  model: "KT-STYLE-0421",
  fabric: "KT-FAB-8812",
  options: { "collar:kent": "KT-COL-01", "cuff:barrel": "KT-CUF-03" },
  upgrades: { monogram: "KT-UPG-MONO" },
};

describe("parseSupplierCapabilities", () => {
  it("defaults to the classic email path when capabilities are absent or garbage", () => {
    expect(parseSupplierCapabilities(null)).toEqual({ adapter: null, mode: "email" });
    expect(parseSupplierCapabilities("nonsense")).toEqual({ adapter: null, mode: "email" });
    expect(parseSupplierCapabilities({})).toEqual({ adapter: null, mode: "email" });
  });

  it("falls back to manual mode when an adapter is set without a valid mode", () => {
    expect(parseSupplierCapabilities({ adapter: "kutetailor" })).toEqual({
      adapter: "kutetailor",
      mode: "manual",
    });
    expect(parseSupplierCapabilities({ adapter: "kutetailor", mode: "banana" })).toEqual({
      adapter: "kutetailor",
      mode: "manual",
    });
  });

  it("accepts an explicit api mode", () => {
    expect(parseSupplierCapabilities({ adapter: "kutetailor", mode: "api" })).toEqual({
      adapter: "kutetailor",
      mode: "api",
    });
  });
});

describe("buildProducerOrderSheet", () => {
  it("resolves external codes and relabels measurements in English", () => {
    const sheet = buildProducerOrderSheet(spec, {
      producer: "kutetailor",
      orderNumber: "CU-1042",
      itemRef: "item_1",
      mapping: fullMapping,
    });

    expect(sheet.producer).toBe("kutetailor");
    expect(sheet.orderNumber).toBe("CU-1042");
    expect(sheet.styleName).toBe("Oxford Business Shirt");
    expect(sheet.styleCode).toBe("KT-STYLE-0421");
    expect(sheet.fabricCode).toBe("oxf-white");
    expect(sheet.fabricExternalCode).toBe("KT-FAB-8812");
    expect(sheet.configuration).toEqual([
      { label: "collar", value: "kent", externalCode: "KT-COL-01" },
      { label: "cuff", value: "barrel", externalCode: "KT-CUF-03" },
    ]);
    expect(sheet.upgrades).toEqual([
      { label: "monogram", value: "cuff", externalCode: "KT-UPG-MONO" },
    ]);
    // Measurements are relabeled in English for the producer portal.
    expect(sheet.measurementsCm).toEqual([
      { field: "neck", label: "Neck", value: 39 },
      { field: "chest", label: "Chest", value: 100 },
      { field: "sleeveLength", label: "Sleeve length", value: 64 },
    ]);
    expect(sheet.labelInstruction).toContain("100% Baumwolle");
    expect(sheet.missingMappings).toEqual([]);
  });

  it("keeps the sheet usable when mappings are missing and lists every gap", () => {
    const sheet = buildProducerOrderSheet(spec, {
      producer: "kutetailor",
      orderNumber: "CU-1042",
      itemRef: "item_1",
      mapping: { options: { "collar:kent": "KT-COL-01" } },
    });

    expect(sheet.styleCode).toBeNull();
    expect(sheet.fabricExternalCode).toBeNull();
    expect(sheet.configuration[1]).toEqual({ label: "cuff", value: "barrel", externalCode: null });
    expect(sheet.upgrades[0]?.externalCode).toBeNull();
    expect(sheet.missingMappings).toEqual([
      "model: Oxford Business Shirt",
      "fabric: oxf-white",
      "option cuff: barrel",
      "upgrade: monogram",
    ]);
  });
});

describe("buildKutetailorApiPayload", () => {
  it("builds the canonical, versioned payload from the sheet", () => {
    const sheet = buildProducerOrderSheet(spec, {
      producer: "kutetailor",
      orderNumber: "CU-1042",
      itemRef: "item_1",
      mapping: fullMapping,
    });
    const payload = buildKutetailorApiPayload(sheet);

    expect(payload).toEqual({
      version: 1,
      reference: "CU-1042/item_1",
      garmentType: "shirt",
      style: { name: "Oxford Business Shirt", code: "KT-STYLE-0421" },
      fabric: { code: "KT-FAB-8812" },
      options: [
        { name: "collar", value: "kent", code: "KT-COL-01" },
        { name: "cuff", value: "barrel", code: "KT-CUF-03" },
        { name: "upgrade:monogram", value: "cuff", code: "KT-UPG-MONO" },
      ],
      measurementsCm: { neck: 39, chest: 100, sleeveLength: 64 },
      remarks: expect.stringContaining("100% Baumwolle"),
    });
  });

  it("refuses to build an API payload while required codes are unmapped", () => {
    const sheet = buildProducerOrderSheet(spec, {
      producer: "kutetailor",
      orderNumber: "CU-1042",
      itemRef: "item_1",
      mapping: {},
    });
    expect(() => buildKutetailorApiPayload(sheet)).toThrow(/missing/i);
  });
});

describe("renderProducerOrderSheetText", () => {
  it("renders a plain-English copy block for the portal", () => {
    const sheet = buildProducerOrderSheet(spec, {
      producer: "kutetailor",
      orderNumber: "CU-1042",
      itemRef: "item_1",
      mapping: fullMapping,
    });
    const text = renderProducerOrderSheetText(sheet);

    expect(text).toContain("Order CU-1042 / item_1");
    expect(text).toContain("Style: Oxford Business Shirt (KT-STYLE-0421)");
    expect(text).toContain("Fabric: KT-FAB-8812 (CUTURA oxf-white)");
    expect(text).toContain("Neck: 39 cm");
    expect(text).toContain("collar: kent (KT-COL-01)");
    // The style rule holds even in generated text: no long dashes.
    expect(text).not.toMatch(/[\u2012-\u2015\u2212]/);
  });

  it("marks unmapped lines so the founder resolves them in the portal", () => {
    const sheet = buildProducerOrderSheet(spec, {
      producer: "kutetailor",
      orderNumber: "CU-1042",
      itemRef: "item_1",
      mapping: {},
    });
    const text = renderProducerOrderSheetText(sheet);
    expect(text).toContain("Fabric: NO CODE MAPPED (CUTURA oxf-white)");
    expect(text).toContain("MISSING MAPPINGS");
  });
});
