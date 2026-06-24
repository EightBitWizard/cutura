import { describe, expect, it } from "vitest";

import { hasAnalyticsConsent, isConsentDecided, parseConsent } from "./consent";

describe("consent", () => {
  it("treats an absent cookie as undecided, analytics off", () => {
    const c = parseConsent(undefined);
    expect(c.decided).toBe(false);
    expect(c.analytics).toBe(false);
    expect(c.necessary).toBe(true);
    expect(isConsentDecided(undefined)).toBe(false);
  });

  it("opt-in grants analytics", () => {
    expect(parseConsent("all")).toEqual({ necessary: true, analytics: true, decided: true });
    expect(hasAnalyticsConsent("all")).toBe(true);
    expect(isConsentDecided("all")).toBe(true);
  });

  it("decline keeps analytics off but is decided", () => {
    expect(parseConsent("necessary")).toEqual({
      necessary: true,
      analytics: false,
      decided: true,
    });
    expect(hasAnalyticsConsent("necessary")).toBe(false);
    expect(isConsentDecided("necessary")).toBe(true);
  });

  it("treats an unknown value as undecided (analytics off)", () => {
    expect(hasAnalyticsConsent("garbage")).toBe(false);
    expect(isConsentDecided("garbage")).toBe(false);
  });
});
