import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { getDb } from "../getDb";
import { notifyRequest } from "../schema";
import { recordNotifyRequest } from "./index";

const db = () => getDb(env.TARGET_TEST_DB);

describe("recordNotifyRequest", () => {
  it("inserts a notify request", async () => {
    const email = `n_${crypto.randomUUID()}@x.ch`;
    const { id } = await recordNotifyRequest(db(), {
      email,
      entityType: "model",
      entityId: "bm1",
      locale: "de",
    });
    const [row] = await db().select().from(notifyRequest).where(eq(notifyRequest.id, id));
    expect(row?.email).toBe(email);
    expect(row?.entityType).toBe("model");
    expect(row?.notifiedAt).toBeNull();
  });
});
