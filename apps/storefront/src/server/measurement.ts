// Guest measurement store: a transient, encrypted measurement-profile version in
// KV (SESSIONS), keyed by a `cutura_measure` HttpOnly cookie token. Body data is
// encrypted at rest (AES-GCM via the core helper) before it touches KV. Registered
// customers get a durable D1 profile in M4; the guest store keeps the same shape.

import {
  type MeasurementProfileVersion,
  decryptJson,
  encryptJson,
  randomToken,
} from "@cutura/core";

import { getEnv } from "./env";

export const MEASURE_COOKIE = "cutura_measure";
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
// Keyed by garment type: a customer ordering a shirt and trousers provides one
// measurement per type, and each cart line resolves the matching one.
const kvKey = (token: string, garmentType: string) => `measure:${token}:${garmentType}`;

export function newMeasureToken(): string {
  return randomToken(18);
}

export function readMeasureToken(cookieHeader: string | null): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === MEASURE_COOKIE) return rest.join("=") || undefined;
  }
  return undefined;
}

export function measureCookie(token: string): string {
  return `${MEASURE_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${TTL_SECONDS}`;
}

export function clearedMeasureCookie(): string {
  return `${MEASURE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;
}

/** Delete a guest measurement blob from KV (after migrating it to an account). */
export async function clearMeasurement(token: string, garmentType: string): Promise<void> {
  await getEnv().SESSIONS.delete(kvKey(token, garmentType));
}

/** Encrypt and store a measurement-profile version under the token + garment type. */
export async function saveMeasurementVersion(
  token: string,
  garmentType: string,
  version: MeasurementProfileVersion,
): Promise<void> {
  const env = getEnv();
  const cipher = await encryptJson(version, env.MEASUREMENT_ENCRYPTION_KEY, "measurement_version");
  await env.SESSIONS.put(kvKey(token, garmentType), cipher, { expirationTtl: TTL_SECONDS });
}

/** Read and decrypt a garment type's measurement version, or null if absent/undecryptable. */
export async function readMeasurementVersion(
  token: string,
  garmentType: string,
): Promise<MeasurementProfileVersion | null> {
  const env = getEnv();
  const cipher = await env.SESSIONS.get(kvKey(token, garmentType));
  if (!cipher) return null;
  try {
    return await decryptJson<MeasurementProfileVersion>(
      cipher,
      env.MEASUREMENT_ENCRYPTION_KEY,
      "measurement_version",
    );
  } catch {
    return null;
  }
}
