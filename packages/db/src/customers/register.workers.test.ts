import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { createProfileVersion, decryptJson } from "@cutura/core";

import { getDb } from "../getDb";
import { measurementVersion, order } from "../schema";
import { claimGuestOrders, findOrCreateCustomer } from "./auth";
import { customerHasProfile, migrateGuestMeasurement } from "./profiles";

const db = () => getDb(env.TARGET_TEST_DB);
const KEY = "test-measurement-encryption-key";
const iso = "2026-06-24T10:00:00.000Z";

async function seedGuestOrder(email: string): Promise<string> {
  const id = crypto.randomUUID();
  await db().insert(order).values({
    id,
    orderNumber: id,
    guestEmail: email,
    guestTrackingToken: crypto.randomUUID(),
    totalMinor: 10000,
    acceptedTermsVersion: "v1",
    acceptedPrivacyVersion: "v1",
    status: "in_review",
    createdAt: iso,
    updatedAt: iso,
  });
  return id;
}

describe("claimGuestOrders", () => {
  it("attaches matching guest orders to the customer and is idempotent", async () => {
    const email = `claim_${crypto.randomUUID()}@x.ch`;
    const o1 = await seedGuestOrder(email);
    await seedGuestOrder(email);
    const { customer } = await findOrCreateCustomer(db(), email, "de");

    expect(await claimGuestOrders(db(), customer.id, email)).toBe(2);
    const [row] = await db().select().from(order).where(eq(order.id, o1));
    expect(row?.customerId).toBe(customer.id);
    expect(await claimGuestOrders(db(), customer.id, email)).toBe(0); // nothing left to claim
  });
});

describe("migrateGuestMeasurement", () => {
  it("creates the first profile + a decryptable version, and is idempotent", async () => {
    const { customer } = await findOrCreateCustomer(db(), `m_${crypto.randomUUID()}@x.ch`, "de");
    const version = createProfileVersion({
      method: "wizard",
      originalInputs: { chest: 100 },
      derivedValues: { neck: 40 },
      confirmedValues: {
        neck: 39,
        shoulder: 46,
        backWidth: 44,
        aboveChest: 96,
        chest: 100,
        armhole: 46,
        biceps: 35,
        wrist: 17,
        sleeveLength: 64,
        shirtLength: 76,
      },
      createdAt: iso,
    });

    const res = await migrateGuestMeasurement(db(), customer.id, version, KEY);
    expect(res).not.toBeNull();
    expect(await customerHasProfile(db(), customer.id)).toBe(true);

    const [mv] = await db()
      .select()
      .from(measurementVersion)
      .where(eq(measurementVersion.profileId, res!.profileId));
    expect(await decryptJson(mv!.confirmedValuesEnc, KEY, "measurement_version")).toEqual(
      version.confirmedValues,
    );

    expect(await migrateGuestMeasurement(db(), customer.id, version, KEY)).toBeNull();
  });
});
