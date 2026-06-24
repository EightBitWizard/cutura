import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { getDb } from "../getDb";
import { createRedirect, deleteRedirect, getRedirect, listRedirects } from "./index";

const db = () => getDb(env.TARGET_TEST_DB);

describe("redirects", () => {
  it("looks up by from-path, upserts, and deletes", async () => {
    const from = `/de/old-${crypto.randomUUID().slice(0, 6)}`;
    expect(await getRedirect(db(), from)).toBeNull();

    const { id } = await createRedirect(db(), { fromPath: from, toPath: "/de/new", code: 301 });
    expect(await getRedirect(db(), from)).toEqual({ toPath: "/de/new", code: 301 });

    // Upsert on the same from-path updates the target.
    await createRedirect(db(), { fromPath: from, toPath: "/de/newer", code: 302 });
    expect(await getRedirect(db(), from)).toEqual({ toPath: "/de/newer", code: 302 });

    expect((await listRedirects(db())).some((r) => r.fromPath === from)).toBe(true);
    await deleteRedirect(db(), id);
    // The upsert kept the same row id, so delete removes it.
    expect(await getRedirect(db(), from)).toBeNull();
  });
});
