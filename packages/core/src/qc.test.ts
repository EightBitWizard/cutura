import { describe, expect, it } from "vitest";

import {
  type QcChecklistItem,
  SHIRT_QC_CHECKLIST,
  TROUSER_QC_CHECKLIST,
  evaluateQcChecklist,
  getDefaultQcChecklist,
} from "./qc";

describe("evaluateQcChecklist", () => {
  const item = (id: string, result: QcChecklistItem["result"], note?: string): QcChecklistItem => ({
    id,
    label: id,
    result,
    note,
  });

  it("fails when any item failed (never silently dropped)", () => {
    expect(evaluateQcChecklist([item("a", "ok"), item("b", "fail"), item("c", "ok")])).toBe("fail");
  });

  it("passes with notes when a passing item carries a note", () => {
    expect(evaluateQcChecklist([item("a", "ok"), item("b", "ok", "small lint")])).toBe(
      "pass_with_notes",
    );
  });

  it("passes a clean checklist", () => {
    expect(evaluateQcChecklist([item("a", "ok"), item("b", "ok")])).toBe("pass");
  });
});

describe("QC checklist templates", () => {
  it("has the expected shirt items in order", () => {
    expect(SHIRT_QC_CHECKLIST.map((i) => i.id)).toEqual([
      "seams",
      "fabric",
      "buttons",
      "collar",
      "cuffs",
      "measurements",
      "pressing",
      "labeling",
      "packaging",
    ]);
  });

  it("has the expected trouser items in order", () => {
    expect(TROUSER_QC_CHECKLIST.map((i) => i.id)).toEqual([
      "seams",
      "fabric",
      "waistband",
      "fly",
      "pockets",
      "beltLoops",
      "measurements",
      "hem",
      "pressing",
      "labeling",
      "packaging",
    ]);
  });

  it("always includes the core measurements check", () => {
    expect(SHIRT_QC_CHECKLIST.some((i) => i.id === "measurements")).toBe(true);
    expect(TROUSER_QC_CHECKLIST.some((i) => i.id === "measurements")).toBe(true);
  });

  it("returns fresh copies so a caller cannot mutate the template", () => {
    const first = getDefaultQcChecklist("shirt");
    first[0]!.label = "tampered";
    expect(getDefaultQcChecklist("shirt")[0]!.label).not.toBe("tampered");
  });

  it("returns the right checklist per garment type", () => {
    expect(getDefaultQcChecklist("shirt")).toHaveLength(9);
    expect(getDefaultQcChecklist("trouser")).toHaveLength(11);
  });
});
