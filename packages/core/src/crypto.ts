// Server-side crypto primitives for signed session cookies and single-use tokens.
// Uses only the Web Crypto API and web-standard globals (crypto.subtle, btoa,
// atob, TextEncoder), so the same code runs on Cloudflare Workers and under the
// Node test runner. Pure and framework-free (no Cloudflare imports), so it lives
// in packages/core and is reused by admin auth (now) and customer auth (M4).
// Ported from the Moola reference. No secrets are logged.

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

const encoder = new TextEncoder();
const buf = (bytes: Uint8Array): BufferSource => bytes as BufferSource;

/** A cryptographically-random, URL-safe token (default 32 bytes). */
export function randomToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

/** SHA-256 of a string as lowercase hex. Used to store only token hashes, never the token. */
export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buf(encoder.encode(input)));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    buf(encoder.encode(secret)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** HMAC-SHA256 of a message with a secret, as lowercase hex. */
export async function hmacSha256Hex(message: string, secret: string): Promise<string> {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, buf(encoder.encode(message)));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time string comparison. Returns false for differing lengths. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export interface SessionPayload {
  /** Subject: the account or admin id. */
  sub: string;
  /** Expiry, epoch seconds. */
  exp: number;
  /** Session version at issue time; bumping the stored version revokes all sessions. */
  ver: number;
}

/** Sign a payload into a compact `base64url(json).base64url(hmac)` token. */
export async function signSession(payload: SessionPayload, secret: string): Promise<string> {
  const body = bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, buf(encoder.encode(body)));
  return `${body}.${bytesToBase64Url(new Uint8Array(sig))}`;
}

/**
 * Verify a session token: checks the HMAC (constant-time via subtle.verify) and
 * the expiry. Returns the payload, or null if invalid, malformed, or expired.
 * nowSeconds is injectable for deterministic tests.
 */
export async function verifySession(
  token: string,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Promise<SessionPayload | null> {
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const key = await hmacKey(secret);
  let valid = false;
  try {
    valid = await crypto.subtle.verify(
      "HMAC",
      key,
      buf(base64UrlToBytes(sig)),
      buf(encoder.encode(body)),
    );
  } catch {
    return null;
  }
  if (!valid) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(body))) as SessionPayload;
  } catch {
    return null;
  }
  if (
    typeof payload.sub !== "string" ||
    typeof payload.exp !== "number" ||
    typeof payload.ver !== "number" ||
    !Number.isInteger(payload.exp) ||
    !Number.isInteger(payload.ver)
  ) {
    return null;
  }
  if (payload.exp <= nowSeconds) return null;
  return payload;
}
