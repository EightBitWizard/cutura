import { describe, expect, it } from "vitest";

import { formatDate, formatNumber } from "./format";

describe("formatDate", () => {
  it("formats an ISO date for a locale and is non-empty", () => {
    const de = formatDate("2026-06-24T10:00:00.000Z", "de");
    expect(de).toContain("2026");
    expect(de.length).toBeGreaterThan(0);
  });

  it("returns an empty string for an invalid date", () => {
    expect(formatDate("not-a-date", "de")).toBe("");
  });
});

describe("formatNumber", () => {
  it("formats a number for a locale", () => {
    expect(formatNumber(1234.5, "de").length).toBeGreaterThan(0);
    expect(formatNumber(1234.5, "en")).toMatch(/1.?234/);
  });
});
