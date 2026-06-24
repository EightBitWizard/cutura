import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { setOperationsSettings } from "../config";
import { getDb } from "../getDb";
import { notifyAdmin } from "./index";
import { FakeEmailProvider } from "./provider";

const db = () => getDb(env.TARGET_TEST_DB);

const SETTINGS = {
  capacityCap: null,
  paused: false,
  pauseMessage: { de: "x" },
  vacationFrom: null,
  vacationUntil: null,
  leadTimeBufferDays: 7,
  capacityHighWaterFraction: 0.8,
  adminEmail: null,
};

describe("notifyAdmin", () => {
  it("skips when no admin email is configured, sends when set", async () => {
    await setOperationsSettings(db(), { ...SETTINGS, adminEmail: null });
    const skipProvider = new FakeEmailProvider();
    const skipped = await notifyAdmin(db(), skipProvider, "new_order", { orderNumber: "CUT-1" });
    expect(skipped.status).toBe("skipped");
    expect(skipProvider.sent.length).toBe(0);

    await setOperationsSettings(db(), { ...SETTINGS, adminEmail: "ops@cutura.ch" });
    const provider = new FakeEmailProvider();
    const sent = await notifyAdmin(db(), provider, "new_order", { orderNumber: "CUT-2" });
    expect(sent.status).toBe("sent");
    expect(provider.sent.length).toBe(1);
    expect(provider.sent[0]?.to).toBe("ops@cutura.ch");
    expect(provider.sent[0]?.subject).toContain("CUT-2");
  });
});
