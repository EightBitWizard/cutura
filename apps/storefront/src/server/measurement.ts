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
const kvKey = (token: string) => `measure:${token}`;

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

/** Delete the guest measurement blob from KV (after migrating it to an account). */
export async function clearMeasurement(token: string): Promise<void> {
  await getEnv().SESSIONS.delete(kvKey(token));
}

/** Encrypt and store a measurement-profile version under the token. */
export async function saveMeasurementVersion(
  token: string,
  version: MeasurementProfileVersion,
): Promise<void> {
  const env = getEnv();
  const cipher = await encryptJson(version, env.MEASUREMENT_ENCRYPTION_KEY, "measurement_version");
  await env.SESSIONS.put(kvKey(token), cipher, { expirationTtl: TTL_SECONDS });
}

/** Read and decrypt the measurement-profile version, or null if absent/undecryptable. */
export async function readMeasurementVersion(
  token: string,
): Promise<MeasurementProfileVersion | null> {
  const env = getEnv();
  const cipher = await env.SESSIONS.get(kvKey(token));
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
