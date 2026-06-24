import { eq } from "drizzle-orm";

import { type MeasurementProfileVersion, encryptJson, inferGarmentType } from "@cutura/core";

import type { Database } from "../getDb";
import { measurementProfile, measurementVersion } from "../schema";
import type { CustomerClock } from "./auth";

const nowIso = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

export async function customerHasProfile(db: Database, customerId: string): Promise<boolean> {
  const rows = await db
    .select({ id: measurementProfile.id })
    .from(measurementProfile)
    .where(eq(measurementProfile.customerId, customerId));
  return rows.length > 0;
}

/** Encrypt and insert a measurement version row for a profile (purpose "measurement_version"). */
async function insertVersion(
  db: Database,
  profileId: string,
  version: MeasurementProfileVersion,
  key: string,
  now: () => string,
  newId: () => string,
): Promise<void> {
  const enc = (v: object) =>
    Object.keys(v).length ? encryptJson(v, key, "measurement_version") : Promise.resolve(null);
  await db.insert(measurementVersion).values({
    id: newId(),
    profileId,
    version: version.version,
    previousVersion: version.previousVersion,
    garmentType: inferGarmentType(version.confirmedValues as unknown as Record<string, unknown>),
    method: version.method,
    originalInputsEnc: await enc(version.originalInputs),
    derivedValuesEnc: await enc(version.derivedValues),
    confirmedValuesEnc: await encryptJson(version.confirmedValues, key, "measurement_version"),
    createdAt: now(),
  });
}

/**
 * Persist a guest's transient measurement (decrypted version) into a D1 profile
 * owned by the customer (FR-661). Idempotent: only creates the customer's first
 * profile; returns null if one already exists. Body data is re-encrypted at rest.
 */
export async function migrateGuestMeasurement(
  db: Database,
  customerId: string,
  version: MeasurementProfileVersion,
  key: string,
  deps: CustomerClock = {},
): Promise<{ profileId: string } | null> {
  if (await customerHasProfile(db, customerId)) return null;
  const now = deps.now ?? nowIso;
  const newId = deps.newId ?? uuid;
  const profileId = newId();
  await db.insert(measurementProfile).values({
    id: profileId,
    customerId,
    name: null,
    currentVersion: version.version,
    createdAt: now(),
    updatedAt: now(),
  });
  await insertVersion(db, profileId, version, key, now, newId);
  return { profileId };
}
