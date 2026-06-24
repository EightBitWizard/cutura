import { and, eq, isNull } from "drizzle-orm";

import {
  type GarmentMeasurements,
  type MeasurementProfileVersion,
  decryptJson,
  encryptJson,
  inferGarmentType,
  reviseConfirmedValues,
} from "@cutura/core";

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

/** Create a new profile (+ its first version) owned by the customer. */
export async function createProfile(
  db: Database,
  customerId: string,
  version: MeasurementProfileVersion,
  key: string,
  name: string | null = null,
  deps: CustomerClock = {},
): Promise<{ profileId: string }> {
  const now = deps.now ?? nowIso;
  const newId = deps.newId ?? uuid;
  const profileId = newId();
  await db.insert(measurementProfile).values({
    id: profileId,
    customerId,
    name,
    currentVersion: version.version,
    createdAt: now(),
    updatedAt: now(),
  });
  await insertVersion(db, profileId, version, key, now, newId);
  return { profileId };
}

/**
 * Persist a guest's transient measurement into a D1 profile owned by the customer
 * (FR-661). Idempotent per garment type: creates a profile only if the customer has
 * none of that garment type yet; returns null otherwise. Body data is re-encrypted
 * at rest. A guest who measured a shirt and trousers migrates both, one each.
 */
export async function migrateGuestMeasurement(
  db: Database,
  customerId: string,
  version: MeasurementProfileVersion,
  key: string,
  deps: CustomerClock = {},
): Promise<{ profileId: string } | null> {
  const garmentType = inferGarmentType(
    version.confirmedValues as unknown as Record<string, unknown>,
  );
  if (await getProfileIdForGarmentType(db, customerId, garmentType)) return null;
  return createProfile(db, customerId, version, key, null, deps);
}

/** The customer's first active profile id, or null. */
export async function getCustomerProfileId(
  db: Database,
  customerId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ id: measurementProfile.id })
    .from(measurementProfile)
    .where(
      and(eq(measurementProfile.customerId, customerId), isNull(measurementProfile.archivedAt)),
    );
  return row?.id ?? null;
}

/**
 * The active profile id matching a garment type (its current version's garment
 * type), or null. Used to resolve the right body measurement per cart line and to
 * keep one profile per garment type.
 */
export async function getProfileIdForGarmentType(
  db: Database,
  customerId: string,
  garmentType: string,
): Promise<string | null> {
  const rows = await db
    .select({ id: measurementProfile.id })
    .from(measurementProfile)
    .innerJoin(
      measurementVersion,
      and(
        eq(measurementVersion.profileId, measurementProfile.id),
        eq(measurementVersion.version, measurementProfile.currentVersion),
      ),
    )
    .where(
      and(
        eq(measurementProfile.customerId, customerId),
        isNull(measurementProfile.archivedAt),
        eq(measurementVersion.garmentType, garmentType),
      ),
    );
  return rows[0]?.id ?? null;
}

export interface ProfileSummary {
  id: string;
  name: string | null;
  currentVersion: number;
  archivedAt: string | null;
}

export interface DecryptedProfile extends ProfileSummary {
  method: "detailed" | "wizard";
  garmentType: string;
  confirmed: GarmentMeasurements;
}

/** Active (non-archived) profiles for a customer; no decryption. */
export async function listProfiles(db: Database, customerId: string): Promise<ProfileSummary[]> {
  const rows = await db
    .select()
    .from(measurementProfile)
    .where(
      and(eq(measurementProfile.customerId, customerId), isNull(measurementProfile.archivedAt)),
    );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    currentVersion: r.currentVersion,
    archivedAt: r.archivedAt,
  }));
}

/** Reconstruct a stored version as a MeasurementProfileVersion (decrypts the layers). */
async function readVersion(
  db: Database,
  profileId: string,
  versionNum: number,
  key: string,
): Promise<MeasurementProfileVersion | null> {
  const [row] = await db
    .select()
    .from(measurementVersion)
    .where(
      and(eq(measurementVersion.profileId, profileId), eq(measurementVersion.version, versionNum)),
    );
  if (!row) return null;
  const dec = async (cipher: string | null) =>
    cipher
      ? await decryptJson<Partial<GarmentMeasurements>>(cipher, key, "measurement_version")
      : {};
  return {
    version: row.version,
    previousVersion: row.previousVersion,
    method: row.method,
    originalInputs: await dec(row.originalInputsEnc),
    derivedValues: await dec(row.derivedValuesEnc),
    confirmedValues: await decryptJson<GarmentMeasurements>(
      row.confirmedValuesEnc,
      key,
      "measurement_version",
    ),
    createdAt: row.createdAt,
  };
}

/** Get a customer's profile (current version, decrypted). Ownership-filtered; null if not owned. */
export async function getProfile(
  db: Database,
  customerId: string,
  profileId: string,
  key: string,
): Promise<DecryptedProfile | null> {
  const [profile] = await db
    .select()
    .from(measurementProfile)
    .where(
      and(eq(measurementProfile.id, profileId), eq(measurementProfile.customerId, customerId)),
    );
  if (!profile) return null;
  const version = await readVersion(db, profileId, profile.currentVersion, key);
  if (!version) return null;
  return {
    id: profile.id,
    name: profile.name,
    currentVersion: profile.currentVersion,
    archivedAt: profile.archivedAt,
    method: version.method,
    garmentType: inferGarmentType(version.confirmedValues as unknown as Record<string, unknown>),
    confirmed: version.confirmedValues,
  };
}

/** Rename a profile (ownership-filtered). Returns false if not owned. */
export async function renameProfile(
  db: Database,
  customerId: string,
  profileId: string,
  name: string,
): Promise<boolean> {
  const [existing] = await db
    .select({ id: measurementProfile.id })
    .from(measurementProfile)
    .where(
      and(eq(measurementProfile.id, profileId), eq(measurementProfile.customerId, customerId)),
    );
  if (!existing) return false;
  await db
    .update(measurementProfile)
    .set({ name, updatedAt: new Date().toISOString() })
    .where(eq(measurementProfile.id, profileId));
  return true;
}

/** Soft-archive a profile (ownership-filtered). Returns false if not owned. */
export async function archiveProfile(
  db: Database,
  customerId: string,
  profileId: string,
): Promise<boolean> {
  const now = new Date().toISOString();
  const [existing] = await db
    .select({ id: measurementProfile.id })
    .from(measurementProfile)
    .where(
      and(eq(measurementProfile.id, profileId), eq(measurementProfile.customerId, customerId)),
    );
  if (!existing) return false;
  await db
    .update(measurementProfile)
    .set({ archivedAt: now, updatedAt: now })
    .where(eq(measurementProfile.id, profileId));
  return true;
}

/**
 * Revise the confirmed values: the only sanctioned mutation. Creates a new version
 * (version+1, predecessor retained) and bumps currentVersion. Ownership-filtered;
 * returns null if not owned.
 */
export async function reviseProfile(
  db: Database,
  customerId: string,
  profileId: string,
  changes: Partial<GarmentMeasurements>,
  key: string,
  deps: CustomerClock = {},
): Promise<{ newVersion: number } | null> {
  const [profile] = await db
    .select()
    .from(measurementProfile)
    .where(
      and(eq(measurementProfile.id, profileId), eq(measurementProfile.customerId, customerId)),
    );
  if (!profile) return null;
  const current = await readVersion(db, profileId, profile.currentVersion, key);
  if (!current) return null;

  const now = deps.now ?? nowIso;
  const newId = deps.newId ?? uuid;
  const revised = reviseConfirmedValues(current, changes, now());
  await insertVersion(db, profileId, revised, key, now, newId);
  await db
    .update(measurementProfile)
    .set({ currentVersion: revised.version, updatedAt: now() })
    .where(eq(measurementProfile.id, profileId));
  return { newVersion: revised.version };
}

/**
 * Persist a freshly confirmed measurement for a logged-in customer: revise the
 * existing profile into a new version, or create the first profile. Used by the
 * measurement flow when a session is present (instead of the guest KV store).
 */
export async function saveCustomerMeasurement(
  db: Database,
  customerId: string,
  version: MeasurementProfileVersion,
  key: string,
  deps: CustomerClock = {},
): Promise<{ profileId: string }> {
  // Revise the profile of the same garment type, or create one for a new type, so a
  // customer keeps a shirt profile and a trouser profile independently.
  const garmentType = inferGarmentType(
    version.confirmedValues as unknown as Record<string, unknown>,
  );
  const profileId = await getProfileIdForGarmentType(db, customerId, garmentType);
  if (!profileId) return createProfile(db, customerId, version, key, null, deps);
  await reviseProfile(db, customerId, profileId, version.confirmedValues, key, deps);
  return { profileId };
}
