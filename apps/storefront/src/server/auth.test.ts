import { generateMagicToken } from "@cutura/core";
import { describe, expect, it } from "vitest";

import {
  type KVLike,
  consumeMagicLink,
  createCustomerSession,
  destroyCustomerSession,
  issueMagicLink,
  readSessionCookie,
  verifyCustomerSession,
} from "./auth";

const SECRET = "session-secret-at-least-32-characters!";

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

describe("customer session", () => {
  it("creates a session that verifies to the customerId, then stops after logout", async () => {
    const kv = new FakeKV();
    const { token } = await createCustomerSession(kv, SECRET, "cust_1");
    expect(await verifyCustomerSession(token, kv, SECRET)).toEqual({
      sessionId: expect.any(String),
      customerId: "cust_1",
    });
    await destroyCustomerSession(token, kv, SECRET);
    expect(await verifyCustomerSession(token, kv, SECRET)).toBeNull();
  });

  it("rejects missing, tampered, or KV-absent tokens", async () => {
    const kv = new FakeKV();
    const { token } = await createCustomerSession(kv, SECRET, "cust_1");
    expect(await verifyCustomerSession(undefined, kv, SECRET)).toBeNull();
    expect(await verifyCustomerSession(`${token}x`, kv, SECRET)).toBeNull();
    expect(await verifyCustomerSession(token, new FakeKV(), SECRET)).toBeNull();
  });
});

describe("magic link", () => {
  it("is single-use and returns the payload exactly once", async () => {
    const kv = new FakeKV();
    const token = generateMagicToken();
    await issueMagicLink(kv, token, "a@b.ch", "de");
    expect(await consumeMagicLink(kv, token)).toEqual({ email: "a@b.ch", locale: "de" });
    expect(await consumeMagicLink(kv, token)).toBeNull();
  });

  it("returns null for an unknown token", async () => {
    expect(await consumeMagicLink(new FakeKV(), "nope")).toBeNull();
  });
});

describe("readSessionCookie", () => {
  it("extracts the cutura_session value", () => {
    expect(readSessionCookie("x=1; cutura_session=abc.def; y=2")).toBe("abc.def");
    expect(readSessionCookie(null)).toBeUndefined();
  });
});
