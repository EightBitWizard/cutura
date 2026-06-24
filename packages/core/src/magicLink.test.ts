import { describe, expect, it } from "vitest";

import { generateMagicToken, hashMagicToken } from "./magicLink";

describe("magicLink", () => {
  it("generates a unique, url-safe token each call", () => {
    const a = generateMagicToken();
    const b = generateMagicToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(a.length).toBeGreaterThan(30);
  });

  it("hashes deterministically and never returns the token itself", async () => {
    const token = generateMagicToken();
    const h1 = await hashMagicToken(token);
    const h2 = await hashMagicToken(token);
    expect(h1).toBe(h2);
    expect(h1).not.toBe(token);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces different hashes for different tokens", async () => {
    expect(await hashMagicToken("a")).not.toBe(await hashMagicToken("b"));
  });
});
