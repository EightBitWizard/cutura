import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { setOperationsSettings } from "../config";
import { FakeEmailProvider } from "../email/provider";
import { getDb } from "../getDb";
import { contactMessage } from "../schema";
import { submitContactMessage } from "./index";

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
  maintenance: false,
};

describe("submitContactMessage", () => {
  it("stores the message and emails the admin when configured", async () => {
    await setOperationsSettings(db(), { ...SETTINGS, adminEmail: "ops@cutura.ch" });
    const provider = new FakeEmailProvider();
    const { id } = await submitContactMessage(db(), provider, {
      name: "Alex",
      email: "alex@x.ch",
      message: "Hello",
      locale: "de",
    });
    const [row] = await db().select().from(contactMessage).where(eq(contactMessage.id, id));
    expect(row?.message).toBe("Hello");
    expect(provider.sent.length).toBe(1);
    expect(provider.sent[0]?.to).toBe("ops@cutura.ch");
    expect(provider.sent[0]?.replyTo).toBe("alex@x.ch");
  });

  it("stores the message without an admin email (no send)", async () => {
    await setOperationsSettings(db(), { ...SETTINGS, adminEmail: null });
    const provider = new FakeEmailProvider();
    const { id } = await submitContactMessage(db(), provider, {
      name: "Sam",
      email: "sam@x.ch",
      message: "Hi",
      locale: "en",
    });
    expect((await db().select().from(contactMessage).where(eq(contactMessage.id, id))).length).toBe(
      1,
    );
    expect(provider.sent.length).toBe(0);
  });
});
