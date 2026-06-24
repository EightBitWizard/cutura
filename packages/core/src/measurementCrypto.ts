// Authenticated symmetric encryption for body measurements at rest (the *_enc
// columns and the production-package snapshot blob). AES-256-GCM via Web Crypto,
// with the key derived from MEASUREMENT_ENCRYPTION_KEY by HKDF-SHA256 under a
// per-purpose `info` label (domain separation between the measurement-version
// rows and the order snapshot). Pure and framework-free: the secret is passed in
// as an argument; this module never reads the environment and never logs
// plaintext or key material. Runs identically on Workers and the Node test pool.

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const buf = (bytes: Uint8Array): BufferSource => bytes as BufferSource;

// Wire format version (leading byte). Reserves a seam for key rotation / algo
// changes: a future version can be detected on decrypt without a format break.
const VERSION = 0x01;
const IV_BYTES = 12;
const MIN_GCM_TAG_BYTES = 16;
const HKDF_SALT = "cutura.measurement.hkdf.v1";

/** Domain-separation label so a snapshot blob and a measurement row use distinct keys. */
export type EncPurpose = "snapshot" | "measurement_version";

/** Thrown for any decryption failure (wrong key, tamper, malformed input). Carries no plaintext or key. */
export class EncryptionError extends Error {
  constructor(message = "decryption failed") {
    super(message);
    this.name = "EncryptionError";
  }
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveAesKey(secret: string, purpose: EncPurpose): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey("raw", buf(encoder.encode(secret)), "HKDF", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: buf(encoder.encode(HKDF_SALT)),
      info: buf(encoder.encode(`cutura.enc.${purpose}`)),
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/** Encrypt a JSON-serializable value. Returns base64url(version || iv || ciphertext+tag). */
export async function encryptJson(
  value: unknown,
  secret: string,
  purpose: EncPurpose,
): Promise<string> {
  const key = await deriveAesKey(secret, purpose);
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const plaintext = encoder.encode(JSON.stringify(value));
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: buf(iv) }, key, buf(plaintext)),
  );
  const out = new Uint8Array(1 + iv.length + cipher.length);
  out[0] = VERSION;
  out.set(iv, 1);
  out.set(cipher, 1 + iv.length);
  return bytesToBase64Url(out);
}

/** Decrypt a value produced by encryptJson with the same secret + purpose. Throws EncryptionError otherwise. */
export async function decryptJson<T = unknown>(
  cipher: string,
  secret: string,
  purpose: EncPurpose,
): Promise<T> {
  let raw: Uint8Array;
  try {
    raw = base64UrlToBytes(cipher);
  } catch {
    throw new EncryptionError();
  }
  if (raw.length < 1 + IV_BYTES + MIN_GCM_TAG_BYTES || raw[0] !== VERSION) {
    throw new EncryptionError();
  }
  const iv = raw.slice(1, 1 + IV_BYTES);
  const body = raw.slice(1 + IV_BYTES);
  const key = await deriveAesKey(secret, purpose);
  let plaintext: ArrayBuffer;
  try {
    plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: buf(iv) }, key, buf(body));
  } catch {
    throw new EncryptionError();
  }
  try {
    return JSON.parse(decoder.decode(plaintext)) as T;
  } catch {
    throw new EncryptionError();
  }
}
