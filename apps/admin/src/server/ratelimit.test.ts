import { describe, expect, it } from "vitest";

import type { KVLike } from "./auth";
import { rateLimit } from "./ratelimit";

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

describe("rateLimit", () => {
  it("allows up to the limit then blocks", async () => {
    const kv = new FakeKV();
    for (let i = 0; i < 3; i++) {
      expect(await rateLimit(kv, "ip", 3, 60)).toBe(true);
    }
    expect(await rateLimit(kv, "ip", 3, 60)).toBe(false);
  });

  it("tracks keys independently", async () => {
    const kv = new FakeKV();
    expect(await rateLimit(kv, "a", 1, 60)).toBe(true);
    expect(await rateLimit(kv, "a", 1, 60)).toBe(false);
    expect(await rateLimit(kv, "b", 1, 60)).toBe(true);
  });
});
