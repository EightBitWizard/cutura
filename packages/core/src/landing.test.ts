import { describe, expect, it } from "vitest";

import { DEFAULT_LANDING_CONFIG, LANDING_CONFIG_KEY, parseLandingConfig } from "./landing";

describe("parseLandingConfig", () => {
  it("returns empty defaults for null/undefined", () => {
    expect(parseLandingConfig(null)).toEqual(DEFAULT_LANDING_CONFIG);
    expect(parseLandingConfig(undefined)).toEqual({});
  });

  it("keeps a valid localized config", () => {
    const value = {
      heroHeadline: { de: "Massgeschneidert", en: "Made to measure" },
      trustBody: { de: "Schweizer Qualitaet" },
    };
    expect(parseLandingConfig(value)).toEqual(value);
  });

  it("accepts a partial config (only some fields set)", () => {
    expect(parseLandingConfig({ fabricTitle: { de: "Stoffe" } })).toEqual({
      fabricTitle: { de: "Stoffe" },
    });
  });

  it("falls back to defaults on the wrong shape", () => {
    expect(parseLandingConfig({ heroHeadline: "not-localized" })).toEqual(DEFAULT_LANDING_CONFIG);
    expect(parseLandingConfig({ heroHeadline: { en: "missing de" } })).toEqual(
      DEFAULT_LANDING_CONFIG,
    );
  });

  it("exposes a stable config key", () => {
    expect(LANDING_CONFIG_KEY).toBe("landing");
  });
});
