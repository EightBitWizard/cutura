import { describe, expect, it } from "vitest";

import { buildOrderSnapshot } from "./snapshot";
import { buildSupplierSpec } from "./supplierSpec";

const snapshot = buildOrderSnapshot({
  baseModelName: "Oxford White",
  fabricCode: "oxf-white",
  configuration: { collar: "kent", cuff: "barrel" },
  upgrades: [{ code: "monogram", placement: "cuff", priceMinor: 1500 }],
  garmentType: "shirt",
  measurementMethod: "wizard",
  measurementProfileVersion: 1,
  confirmedValues: {
    neck: 39,
    shoulder: 46,
    backWidth: 44,
    aboveChest: 96,
    chest: 100,
    armhole: 46,
    biceps: 35,
    wrist: 17,
    sleeveLength: 64,
    shirtLength: 76,
  },
  price: { base: 12900, fabric: 0, options: 0, upgrades: 1500, total: 14400 },
  createdAt: "2026-06-24T10:00:00.000Z",
});

describe("buildSupplierSpec", () => {
  it("lists every measurement, the config, and upgrades with placement + price", () => {
    const spec = buildSupplierSpec(snapshot);
    expect(spec.baseModelName).toBe("Oxford White");
    expect(spec.fabricCode).toBe("oxf-white");
    expect(spec.measurements.map((m) => m.field)).toEqual([
      "neck",
      "shoulder",
      "backWidth",
      "aboveChest",
      "chest",
      "armhole",
      "biceps",
      "wrist",
      "sleeveLength",
      "shirtLength",
    ]);
    expect(spec.measurements.every((m) => m.label.length > 0)).toBe(true);
    expect(spec.configuration).toEqual([
      { key: "collar", value: "kent" },
      { key: "cuff", value: "barrel" },
    ]);
    expect(spec.upgrades[0]).toEqual({ code: "monogram", placement: "cuff", price: "CHF 15.00" });
  });

  it("carries provided images", () => {
    const spec = buildSupplierSpec(snapshot, {
      images: [{ r2Key: "media/model/1", caption: "Model" }],
    });
    expect(spec.images).toHaveLength(1);
  });

  it("carries the language-neutral sewn-in label, defaulting to empty", () => {
    expect(buildSupplierSpec(snapshot).label).toEqual({});
    const spec = buildSupplierSpec(snapshot, {
      label: { composition: "100% Cotton", care: "30C, no bleach" },
    });
    expect(spec.label.composition).toBe("100% Cotton");
    expect(spec.label.care).toBe("30C, no bleach");
  });
});
