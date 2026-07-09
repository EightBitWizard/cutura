import { describe, expect, it } from "vitest";

import { localeSwitchHref } from "./localeSwitchHref";

describe("localeSwitchHref", () => {
  it("preserves the query string when switching locale", () => {
    // Regression: switching language on /measure?gt=jacket must not reset to the default garment type.
    expect(localeSwitchHref("fr", "/de/measure", "gt=jacket&return=%2Fde%2Fcart")).toBe(
      "/fr/measure?gt=jacket&return=%2Fde%2Fcart",
    );
  });

  it("switches a plain path without query", () => {
    expect(localeSwitchHref("it", "/de/discover", "")).toBe("/it/discover");
  });

  it("handles the locale root", () => {
    expect(localeSwitchHref("en", "/de", "")).toBe("/en");
    expect(localeSwitchHref("en", "/de", "q=hemd")).toBe("/en?q=hemd");
  });

  it("prefixes a path that carries no locale segment", () => {
    expect(localeSwitchHref("de", "/", "")).toBe("/de");
    expect(localeSwitchHref("de", "/search", "q=hemd")).toBe("/de/search?q=hemd");
  });
});
