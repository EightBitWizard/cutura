import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { getDb } from "../getDb";
import { recommendationSignal } from "../schema";
import { captureSignal } from "./index";

const db = () => getDb(env.TARGET_TEST_DB);

describe("captureSignal", () => {
  it("appends a signal row for a guest and for a customer", async () => {
    const guest = await captureSignal(db(), {
      sessionId: "sess-guest",
      signalType: "view",
      entityType: "model",
      entityId: "m1",
    });
    const [g] = await db()
      .select()
      .from(recommendationSignal)
      .where(eq(recommendationSignal.id, guest.id));
    expect(g?.signalType).toBe("view");
    expect(g?.customerId).toBeNull();
    expect(g?.entityId).toBe("m1");

    const cust = await captureSignal(db(), {
      customerId: "cust-1",
      sessionId: "cust-1",
      signalType: "cart_add",
      entityType: "model",
      entityId: "m2",
    });
    const [c] = await db()
      .select()
      .from(recommendationSignal)
      .where(eq(recommendationSignal.id, cust.id));
    expect(c?.customerId).toBe("cust-1");
    expect(c?.signalType).toBe("cart_add");
  });
});
