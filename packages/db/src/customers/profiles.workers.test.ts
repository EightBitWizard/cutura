import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { type GarmentMeasurements, createProfileVersion } from "@cutura/core";

import { getDb } from "../getDb";
import { findOrCreateCustomer } from "./auth";
import {
  archiveProfile,
  getProfile,
  listProfiles,
  migrateGuestMeasurement,
  renameProfile,
  reviseProfile,
} from "./profiles";

const db = () => getDb(env.TARGET_TEST_DB);
const KEY = "test-measurement-encryption-key";

const confirmed: GarmentMeasurements = {
  chest: 100,
  waist: 88,
  hips: 96,
  neck: 40,
  shoulder: 46,
  sleeveLength: 64,
  shirtLength: 76,
};

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
    expect(m.waist).toBe(88); // unchanged
  });

  it("archives a profile out of the active list", async () => {
    const { customerId, profileId } = await seedProfile();
    expect(await archiveProfile(db(), customerId, profileId)).toBe(true);
    expect((await listProfiles(db(), customerId)).map((p) => p.id)).not.toContain(profileId);
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
