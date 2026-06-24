// Passwordless magic-link primitives (pure). The plaintext token travels only in
// the emailed link; only its SHA-256 hash is ever stored (in KV), so a leaked
// store cannot be used to forge a login - the same hash-not-secret discipline as
// admin password handling. Single-use + TTL are enforced by the storefront KV
// layer that consumes these.

import { randomToken, sha256Hex } from "./crypto";

/** A fresh, high-entropy, URL-safe magic-link token (256 bits). */
export function generateMagicToken(): string {
  return randomToken(32);
}

/** The stored lookup key for a token: its SHA-256 hash (lowercase hex). */
export function hashMagicToken(token: string): Promise<string> {
  return sha256Hex(token);
}
