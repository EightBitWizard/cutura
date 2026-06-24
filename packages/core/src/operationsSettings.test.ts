import { describe, expect, it } from "vitest";

import {
  CALM_PAUSE_MESSAGE,
  DEFAULT_OPERATIONS_SETTINGS,
  type OperationsSettings,
  pauseMessageFor,
  parseOperationsSettings,
} from "./operationsSettings";

describe("operations settings", () => {
  it("defaults to not paused, no cap, with the calm message in four languages", () => {
    expect(DEFAULT_OPERATIONS_SETTINGS.paused).toBe(false);
    expect(DEFAULT_OPERATIONS_SETTINGS.capacityCap).toBeNull();
    for (const l of ["de", "en", "it", "fr"] as const) {
      expect(CALM_PAUSE_MESSAGE[l].length).toBeGreaterThan(0);
    }
  });

  it("returns defaults for malformed stored values", () => {
    expect(parseOperationsSettings(undefined)).toEqual(DEFAULT_OPERATIONS_SETTINGS);
    expect(parseOperationsSettings({ capacityCap: "lots" })).toEqual(DEFAULT_OPERATIONS_SETTINGS);
  });

  it("round-trips a valid settings object", () => {
    const s: OperationsSettings = {
      capacityCap: 25,
      paused: true,
      pauseMessage: { de: "Pause", en: "Paused" },
      vacationFrom: "2026-07-01",
      vacationUntil: "2026-07-14",
      leadTimeBufferDays: 10,
      capacityHighWaterFraction: 0.75,
    };
    expect(parseOperationsSettings(s)).toEqual(s);
  });

  it("resolves the pause message with locale fallback then the calm default", () => {
    const s = { ...DEFAULT_OPERATIONS_SETTINGS, pauseMessage: { de: "Geschlossen" } };
    expect(pauseMessageFor(s, "de")).toBe("Geschlossen");
    expect(pauseMessageFor(s, "it")).toBe("Geschlossen"); // falls back to de
    const empty = { ...DEFAULT_OPERATIONS_SETTINGS, pauseMessage: { de: "" } };
    expect(pauseMessageFor(empty, "fr")).toBe(CALM_PAUSE_MESSAGE.fr); // calm default
  });
});
