import { describe, expect, it } from "vitest";

import { pickLocale } from "./i18nDetect";

const SUPPORTED = ["de", "en", "it", "fr"] as const;

describe("pickLocale", () => {
  it("picks the highest-q supported language", () => {
    expect(pickLocale("en-US,en;q=0.9,de;q=0.8", SUPPORTED, "de")).toBe("en");
    expect(pickLocale("fr-CH,fr;q=0.9", SUPPORTED, "de")).toBe("fr");
  });

  it("respects q-ordering over position", () => {
    expect(pickLocale("de;q=0.3,it;q=0.9", SUPPORTED, "de")).toBe("it");
  });

  it("falls back when unsupported or absent", () => {
    expect(pickLocale("es-ES,es;q=0.9", SUPPORTED, "de")).toBe("de");
    expect(pickLocale(null, SUPPORTED, "de")).toBe("de");
    expect(pickLocale("", SUPPORTED, "de")).toBe("de");
  });
});
