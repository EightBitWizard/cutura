// Admin authentication, separate from customer auth (REQUIREMENTS.md E2 US-2.7;
// FR-260). A single founder logs in with a password checked timing-safe against
// the ADMIN_AUTH_SECRET secret; a signed, http-only session cookie is backed by
// a KV record so logout (and future revocation) takes effect server-side. Pure
// of the HTTP layer: takes an injected KV-like store and secrets, so it is
// unit-tested on the Node pool. Crypto comes from @cutura/core.

import { randomToken, sha256Hex, signSession, timingSafeEqual, verifySession } from "@cutura/core";

/** Minimal KV surface; Cloudflare KVNamespace satisfies it. */
export interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export const SESSION_COOKIE = "cutura_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours
const KV_PREFIX = "admin-session:";

/** Timing-safe check of the login password against the configured admin secret. */
export async function verifyAdminPassword(password: string, adminSecret: string): Promise<boolean> {
  if (!adminSecret || !password) return false;
  const [a, b] = await Promise.all([sha256Hex(password), sha256Hex(adminSecret)]);
  return timingSafeEqual(a, b);
}

/** Create a session: store its id in KV and return the signed cookie token. */
export async function createSession(
  kv: KVLike,
  sessionSecret: string,
  now: () => Date = () => new Date(),
): Promise<string> {
  const sessionId = randomToken();
  const exp = Math.floor(now().getTime() / 1000) + SESSION_TTL_SECONDS;
  await kv.put(`${KV_PREFIX}${sessionId}`, "1", { expirationTtl: SESSION_TTL_SECONDS });
  return signSession({ sub: sessionId, exp, ver: 1 }, sessionSecret);
}

/** True only if the token's HMAC + expiry are valid AND its KV record still exists. */
export async function verifySessionToken(
  token: string | null | undefined,
  kv: KVLike,
  sessionSecret: string,
  nowSeconds?: number,
): Promise<boolean> {
  if (!token) return false;
  const payload = await verifySession(token, sessionSecret, nowSeconds);
  if (!payload) return false;
  return (await kv.get(`${KV_PREFIX}${payload.sub}`)) !== null;
}

/** Remove the session's KV record (logout / revocation). */
export async function destroySession(
  token: string | null | undefined,
  kv: KVLike,
  sessionSecret: string,
): Promise<void> {
  if (!token) return;
  // nowSeconds=0 so an only-just-expired token can still be cleaned up.
  const payload = await verifySession(token, sessionSecret, 0);
  if (payload) await kv.delete(`${KV_PREFIX}${payload.sub}`);
}

export function sessionCookie(token: string, maxAgeSeconds = SESSION_TTL_SECONDS): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export function clearedSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function readSessionCookie(cookieHeader: string | null | undefined): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === SESSION_COOKIE) return rest.join("=");
  }
  return undefined;
}
