import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { getDb } from "../getDb";
import { media } from "../schema";
import { type MediaBucketPair, copyPublishedMedia } from "./publishEntity";

const db = () => getDb(env.TARGET_TEST_DB);
const iso = "2026-06-24T10:00:00.000Z";

function fakeBuckets(sourceKeys: string[]): { pair: MediaBucketPair; put: string[] } {
  const source = new Set(sourceKeys);
  const targetStore = new Set<string>();
  const put: string[] = [];
  const pair: MediaBucketPair = {
    source: {
      async get(key) {
        return source.has(key) ? { body: new Blob([key]).stream() } : null;
      },
    },
    target: {
      async head(key) {
        return targetStore.has(key) ? {} : null;
      },
      async put(key) {
        targetStore.add(key);
        put.push(key);
        return {};
      },
    },
  };
  return { pair, put };
}

describe("copyPublishedMedia", () => {
  it("copies published media objects missing from the target, idempotently, skipping absent sources", async () => {
    const tag = crypto.randomUUID().slice(0, 6);
    const k1 = `media/model/${tag}-1`;
    const k2 = `media/model/${tag}-2`;
    await db()
      .insert(media)
      .values([
        {
          id: crypto.randomUUID(),
          r2Key: k1,
          entityType: "model",
          entityId: `m_${tag}`,
          position: 0,
          isPrimary: true,
          createdAt: iso,
          updatedAt: iso,
        },
        {
          id: crypto.randomUUID(),
          r2Key: k2,
          entityType: "model",
          entityId: `m_${tag}`,
          position: 1,
          isPrimary: false,
          createdAt: iso,
          updatedAt: iso,
        },
      ]);

    // The source bucket has k1 but not k2.
    const { pair, put } = fakeBuckets([k1]);
    await copyPublishedMedia(db(), pair);
    expect(put).toContain(k1);
    expect(put).not.toContain(k2); // no source object -> skipped, not invented

    // Idempotent: k1 is now in the target, so a re-run copies nothing new.
    const putCount = put.length;
    await copyPublishedMedia(db(), pair);
    expect(put.length).toBe(putCount);
  });
});
