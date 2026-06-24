import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { encryptJson } from "@cutura/core";

import { getDb } from "../getDb";
import { findOrCreateCustomer } from "../customers/auth";
import { auditLog, measurementProfile, measurementVersion, order } from "../schema";
import {
  getCustomerAdminView,
  listCustomersAdmin,
  setCustomerNotesTags,
  setOrderNotesTags,
} from "./customers";

const db = () => getDb(env.TARGET_TEST_DB);
const KEY = "test-measurement-encryption-key";
const iso = "2026-07-05T10:00:00.000Z";

describe("admin customer management", () => {
  it("returns the full view, decrypts measurements, and writes a sensitive-access audit", async () => {
    const { customer } = await findOrCreateCustomer(db(), `adm_${crypto.randomUUID()}@x.ch`, "de");
    const orderId = crypto.randomUUID();
    await db()
      .insert(order)
      .values({
        id: orderId,
        orderNumber: `O-${orderId.slice(0, 6)}`,
        customerId: customer.id,
        totalMinor: 12900,
        acceptedTermsVersion: "v1",
        acceptedPrivacyVersion: "v1",
        status: "shipped",
        createdAt: iso,
        updatedAt: iso,
      });
    const profileId = crypto.randomUUID();
    await db().insert(measurementProfile).values({
      id: profileId,
      customerId: customer.id,
      name: "P",
      currentVersion: 1,
      createdAt: iso,
      updatedAt: iso,
    });
    await db()
      .insert(measurementVersion)
      .values({
        id: crypto.randomUUID(),
        profileId,
        version: 1,
        garmentType: "shirt",
        method: "wizard",
        confirmedValuesEnc: await encryptJson({ chest: 100 }, KEY, "measurement_version"),
        createdAt: iso,
      });

    const view = await getCustomerAdminView(db(), customer.id, KEY);
    expect(view?.orders.length).toBe(1);
    expect(view?.profiles[0]?.confirmed).toEqual({ chest: 100 });

    const audits = await db().select().from(auditLog).where(eq(auditLog.entityId, customer.id));
    expect(audits.some((a) => a.action === "customer.view")).toBe(true);

    expect((await listCustomersAdmin(db())).some((c) => c.id === customer.id)).toBe(true);
  });

  it("sets notes + tags on a customer and an order", async () => {
    const { customer } = await findOrCreateCustomer(db(), `nt_${crypto.randomUUID()}@x.ch`, "de");
    await setCustomerNotesTags(db(), customer.id, { notes: "VIP", tags: ["repeat"] }, "admin");
    const view = await getCustomerAdminView(db(), customer.id, KEY);
    expect(view?.customer.notes).toBe("VIP");
    expect(view?.customer.tags).toEqual(["repeat"]);

    const orderId = crypto.randomUUID();
    await db()
      .insert(order)
      .values({
        id: orderId,
        orderNumber: `O-${orderId.slice(0, 6)}`,
        customerId: customer.id,
        totalMinor: 1,
        acceptedTermsVersion: "v1",
        acceptedPrivacyVersion: "v1",
        status: "new",
        createdAt: iso,
        updatedAt: iso,
      });
    await setOrderNotesTags(db(), orderId, { notes: "rush", tags: ["priority"] }, "admin");
    const [o] = await db().select().from(order).where(eq(order.id, orderId));
    expect(o?.notes).toBe("rush");
    expect(o?.tags).toEqual(["priority"]);
  });
});
