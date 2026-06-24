import { describe, expect, it } from "vitest";

import {
  type SessionPayload,
  hmacSha256Hex,
  randomToken,
  sha256Hex,
  signSession,
  timingSafeEqual,
  verifySession,
} from "./crypto";

const SECRET = "test-secret-at-least-32-characters-long!!";

describe("randomToken", () => {
  it("returns a url-safe token and is unique per call", () => {
    const a = randomToken();
    const b = randomToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(a.length).toBeGreaterThan(20);
  });
});

describe("sha256Hex", () => {
  it("produces the known SHA-256 of 'abc'", async () => {
    expect(await sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});

describe("hmacSha256Hex", () => {
  it("is deterministic for the same message and secret", async () => {
    const a = await hmacSha256Hex("message", SECRET);
    const b = await hmacSha256Hex("message", SECRET);
    expect(a).toBe(b);
    expect(a).not.toBe(await hmacSha256Hex("message", "other-secret"));
  });
});

describe("timingSafeEqual", () => {
  it("is true for equal strings and false otherwise", () => {
    expect(timingSafeEqual("abcdef", "abcdef")).toBe(true);
    expect(timingSafeEqual("abcdef", "abcxyz")).toBe(false);
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
  });
});

describe("signSession / verifySession", () => {
  const payload: SessionPayload = { sub: "admin", exp: 4102444800, ver: 1 };

  it("round-trips a valid session", async () => {
    const token = await signSession(payload, SECRET);
    expect(await verifySession(token, SECRET)).toEqual(payload);
  });

  it("rejects a tampered token", async () => {
    const token = await signSession(payload, SECRET);
    const tampered = `${token}x`;
    expect(await verifySession(tampered, SECRET)).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signSession(payload, SECRET);
    expect(await verifySession(token, "different-secret-different-secret-xx")).toBeNull();
  });

  it("rejects an expired token", async () => {
    const expired = await signSession({ sub: "admin", exp: 1000, ver: 1 }, SECRET);
    expect(await verifySession(expired, SECRET, 2000)).toBeNull();
  });

  it("rejects a malformed token", async () => {
    expect(await verifySession("not-a-token", SECRET)).toBeNull();
    expect(await verifySession("", SECRET)).toBeNull();
  });
});
