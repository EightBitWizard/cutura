import { describe, expect, it, vi } from "vitest";

import { verifyTurnstile } from "./turnstile";

describe("verifyTurnstile", () => {
  it("passes through (allows) when no secret is configured", async () => {
    expect(await verifyTurnstile(null, undefined)).toBe(true);
    expect(await verifyTurnstile("", "")).toBe(true);
  });

  it("rejects a missing token when a secret is configured", async () => {
    const f = vi.fn();
    expect(await verifyTurnstile("", "secret", f as unknown as typeof fetch)).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });

  it("returns the siteverify success result", async () => {
    const ok = (async () => ({ json: async () => ({ success: true }) })) as unknown as typeof fetch;
    const bad = (async () => ({
      json: async () => ({ success: false }),
    })) as unknown as typeof fetch;
    expect(await verifyTurnstile("tok", "secret", ok)).toBe(true);
    expect(await verifyTurnstile("tok", "secret", bad)).toBe(false);
  });
});
