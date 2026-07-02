import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { type GarmentMeasurements, createProfileVersion } from "@cutura/core";

import { getDb } from "../getDb";
import { findOrCreateCustomer } from "./auth";
import {
  archiveProfile,
  getProfile,
  getProfileIdForGarmentType,
  listProfiles,
  migrateGuestMeasurement,
  renameProfile,
  reviseProfile,
  saveCustomerMeasurement,
} from "./profiles";

const db = () => getDb(env.TARGET_TEST_DB);
const KEY = "test-measurement-encryption-key";

const confirmed: GarmentMeasurements = {
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
};

const trouserConfirmed: GarmentMeasurements = {
  waist: 88,
  belly: 92,
  hips: 100,
  crotch: 66,
  thigh: 58,
  calf: 38,
  trouserLength: 108,
};

function versionFor(values: GarmentMeasurements) {
  return createProfileVersion({
    method: "wizard",
    originalInputs: {},
    derivedValues: {},
    confirmedValues: values,
    createdAt: "2026-06-24T10:00:00.000Z",
  });
}

async function seedProfile(): Promise<{ customerId: string; profileId: string }> {
  const { customer } = await findOrCreateCustomer(db(), `p_${crypto.randomUUID()}@x.ch`, "de");
  const version = createProfileVersion({
    method: "wizard",
    originalInputs: {},
    derivedValues: {},
    confirmedValues: confirmed,
    createdAt: "2026-06-24T10:00:00.000Z",
  });
  const res = await migrateGuestMeasurement(db(), customer.id, version, KEY);
  return { customerId: customer.id, profileId: res!.profileId };
}

describe("profile management", () => {
  it("lists, gets (decrypted), and renames", async () => {
    const { customerId, profileId } = await seedProfile();
    const list = await listProfiles(db(), customerId);
    expect(list.map((p) => p.id)).toContain(profileId);

    const got = await getProfile(db(), customerId, profileId, KEY);
    expect(got?.confirmed).toEqual(confirmed);
    expect(got?.garmentType).toBe("shirt");

    expect(await renameProfile(db(), customerId, profileId, "Alltag")).toBe(true);
    expect((await getProfile(db(), customerId, profileId, KEY))?.name).toBe("Alltag");
  });

  it("revises confirmed values into a new version and bumps currentVersion", async () => {
    const { customerId, profileId } = await seedProfile();
    const res = await reviseProfile(db(), customerId, profileId, { chest: 104 }, KEY);
    expect(res?.newVersion).toBe(2);
    const got = await getProfile(db(), customerId, profileId, KEY);
    expect(got?.currentVersion).toBe(2);
    const m = got?.confirmed as unknown as Record<string, number>;
    expect(m.chest).toBe(104);
    expect(m.neck).toBe(39); // unchanged
  });

  it("archives a profile out of the active list", async () => {
    const { customerId, profileId } = await seedProfile();
    expect(await archiveProfile(db(), customerId, profileId)).toBe(true);
    expect((await listProfiles(db(), customerId)).map((p) => p.id)).not.toContain(profileId);
  });

  it("keeps one profile per garment type (shirt and trouser are independent)", async () => {
    const { customer } = await findOrCreateCustomer(db(), `g_${crypto.randomUUID()}@x.ch`, "de");

    // First a shirt, then a trouser: two distinct profiles.
    const shirt = await saveCustomerMeasurement(db(), customer.id, versionFor(confirmed), KEY);
    const trouser = await saveCustomerMeasurement(
      db(),
      customer.id,
      versionFor(trouserConfirmed),
      KEY,
    );
    expect(trouser.profileId).not.toBe(shirt.profileId);
    expect(await listProfiles(db(), customer.id)).toHaveLength(2);

    // The right profile resolves per garment type.
    expect(await getProfileIdForGarmentType(db(), customer.id, "shirt")).toBe(shirt.profileId);
    expect(await getProfileIdForGarmentType(db(), customer.id, "trouser")).toBe(trouser.profileId);

    // Saving the same garment type again revises that profile, not a new one.
    const again = await saveCustomerMeasurement(
      db(),
      customer.id,
      versionFor({ ...trouserConfirmed, trouserLength: 110 }),
      KEY,
    );
    expect(again.profileId).toBe(trouser.profileId);
    expect(await listProfiles(db(), customer.id)).toHaveLength(2);
    expect((await getProfile(db(), customer.id, trouser.profileId, KEY))?.currentVersion).toBe(2);
  });

  it("rejects access by a non-owner", async () => {
    const { profileId } = await seedProfile();
    const { customer: other } = await findOrCreateCustomer(
      db(),
      `o_${crypto.randomUUID()}@x.ch`,
      "de",
    );
    expect(await getProfile(db(), other.id, profileId, KEY)).toBeNull();
    expect(await renameProfile(db(), other.id, profileId, "x")).toBe(false);
    expect(await reviseProfile(db(), other.id, profileId, { chest: 1 }, KEY)).toBeNull();
    expect(await archiveProfile(db(), other.id, profileId)).toBe(false);
  });
});
