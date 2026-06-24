import { describe, expect, it } from "vitest";

import {
  type KVLike,
  createSession,
  destroySession,
  readSessionCookie,
  verifyAdminPassword,
  verifySessionToken,
} from "./auth";

const SESSION_SECRET = "session-secret-at-least-32-characters!";
const ADMIN_SECRET = "correct horse battery staple";

class FakeKV implements KVLike {
  store = new Map<string, string>();
  get(key: string) {
    return Promise.resolve(this.store.get(key) ?? null);
  }
  put(key: string, value: string) {
    this.store.set(key, value);
    return Promise.resolve();
  }
  delete(key: string) {
    this.store.delete(key);
    return Promise.resolve();
  }
}

describe("verifyAdminPassword", () => {
  it("accepts the correct password and rejects others", async () => {
    expect(await verifyAdminPassword(ADMIN_SECRET, ADMIN_SECRET)).toBe(true);
    expect(await verifyAdminPassword("wrong", ADMIN_SECRET)).toBe(false);
    expect(await verifyAdminPassword("", ADMIN_SECRET)).toBe(false);
  });

  it("rejects when no admin secret is configured", async () => {
    expect(await verifyAdminPassword("anything", "")).toBe(false);
  });
});

describe("session lifecycle", () => {
  it("creates a session that verifies, then stops verifying after logout", async () => {
    const kv = new FakeKV();
    const token = await createSession(kv, SESSION_SECRET);
    expect(await verifySessionToken(token, kv, SESSION_SECRET)).toBe(true);

    await destroySession(token, kv, SESSION_SECRET);
    expect(await verifySessionToken(token, kv, SESSION_SECRET)).toBe(false);
  });

  it("rejects a missing, tampered, or KV-absent token", async () => {
    const kv = new FakeKV();
    const token = await createSession(kv, SESSION_SECRET);
    expect(await verifySessionToken(undefined, kv, SESSION_SECRET)).toBe(false);
    expect(await verifySessionToken(`${token}x`, kv, SESSION_SECRET)).toBe(false);
    // valid signature but not present in KV (e.g. server-side revoked)
    const other = new FakeKV();
    expect(await verifySessionToken(token, other, SESSION_SECRET)).toBe(false);
  });
});

describe("readSessionCookie", () => {
  it("extracts the session cookie value", () => {
    expect(readSessionCookie("foo=1; cutura_admin_session=abc.def; bar=2")).toBe("abc.def");
    expect(readSessionCookie("")).toBeUndefined();
    expect(readSessionCookie(null)).toBeUndefined();
  });
});
