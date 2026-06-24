import { describe, expect, it } from "vitest";

import { isWithinFitReviewWindow } from "./fitWindow";

describe("isWithinFitReviewWindow", () => {
  const shipped = "2026-06-01T00:00:00.000Z";

  it("accepts a request within the window", () => {
    expect(isWithinFitReviewWindow(shipped, "2026-06-20T00:00:00.000Z", 30)).toBe(true);
  });

  it("rejects a request after the window", () => {
    expect(isWithinFitReviewWindow(shipped, "2026-07-15T00:00:00.000Z", 30)).toBe(false);
  });

  it("rejects when never shipped or with bad input", () => {
    expect(isWithinFitReviewWindow(null, "2026-06-20T00:00:00.000Z", 30)).toBe(false);
    expect(isWithinFitReviewWindow(shipped, "not-a-date", 30)).toBe(false);
  });
});
