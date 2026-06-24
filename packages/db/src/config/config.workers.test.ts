import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { DEFAULT_OPERATIONS_SETTINGS } from "@cutura/core";

import { getDb } from "../getDb";
import {
  getConfig,
  getFeatureFlag,
  getOperationsSettings,
  setConfig,
  setFeatureFlag,
  setOperationsSettings,
} from "./index";

const db = () => getDb(env.TARGET_TEST_DB);

describe("config layer", () => {
  it("round-trips a config value (upsert)", async () => {
    const key = `k_${crypto.randomUUID()}`;
    expect(await getConfig(db(), key)).toBeNull();
    await setConfig(db(), key, { a: 1 });
    expect(await getConfig(db(), key)).toEqual({ a: 1 });
    await setConfig(db(), key, { a: 2 });
    expect(await getConfig(db(), key)).toEqual({ a: 2 });
  });

  it("round-trips a feature flag", async () => {
    const key = `flag_${crypto.randomUUID()}`;
    expect(await getFeatureFlag(db(), key)).toBeNull();
    await setFeatureFlag(db(), key, true, { ramp: 0.5 });
    expect(await getFeatureFlag(db(), key)).toEqual({ enabled: true, value: { ramp: 0.5 } });
  });

  it("defaults operations settings when unset, then round-trips", async () => {
    // A fresh DB has no operations key -> defaults.
    const initial = await getOperationsSettings(db());
    expect(initial.paused).toBe(DEFAULT_OPERATIONS_SETTINGS.paused);

    await setOperationsSettings(db(), {
      ...DEFAULT_OPERATIONS_SETTINGS,
      capacityCap: 20,
      paused: true,
      pauseMessage: { de: "Pause" },
    });
    const got = await getOperationsSettings(db());
    expect(got.capacityCap).toBe(20);
    expect(got.paused).toBe(true);
    expect(got.pauseMessage.de).toBe("Pause");
  });
});
