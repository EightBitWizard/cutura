// Customer authentication for the storefront. Passwordless: a magic-link token
// (hash stored in KV, single-use, short TTL) issues a customer session. Sessions
// mirror the admin pattern - a signed http-only cookie backed by a KV record so
// verification is fast (no D1 on the request path) and logout/revocation is
// instant. The KV record's value is the customerId, so ownership is known from
// the cookie alone. A D1 `session` row is written through separately (db helper)
// for deletion enumeration. Pure of the HTTP layer: takes an injected KV-like
// store + secret, unit-tested on the Node pool. Crypto comes from @cutura/core.

import { hashMagicToken, randomToken, signSession, verifySession } from "@cutura/core";

/** Minimal KV surface; Cloudflare KVNamespace satisfies it. */
export interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export const SESSION_COOKIE = "cutura_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const SESSION_PREFIX = "customer-session:";

const MAGIC_PREFIX = "magiclink:";
const MAGIC_TTL_SECONDS = 60 * 15; // 15 minutes

export interface MagicPayload {
  email: string;
  locale: string;
}

/** Store a magic-link request keyed by the token hash (single-use, short TTL). */
export async function issueMagicLink(
  kv: KVLike,
  token: string,
  email: string,
  locale: string,
  now: () => Date = () => new Date(),
): Promise<void> {
  const hash = await hashMagicToken(token);
  await kv.put(
    `${MAGIC_PREFIX}${hash}`,
    JSON.stringify({ email, locale, createdAt: now().toISOString() }),
    { expirationTtl: MAGIC_TTL_SECONDS },
  );
}

/** Consume a magic-link token: returns its payload and deletes it (single-use). */
export async function consumeMagicLink(kv: KVLike, token: string): Promise<MagicPayload | null> {
  const hash = await hashMagicToken(token);
  const key = `${MAGIC_PREFIX}${hash}`;
  const raw = await kv.get(key);
  if (!raw) return null;
  await kv.delete(key); // single-use: delete before issuing the session
  try {
    const parsed = JSON.parse(raw) as MagicPayload;
    if (typeof parsed.email !== "string") return null;
    return {
      email: parsed.email,
      locale: typeof parsed.locale === "string" ? parsed.locale : "de",
    };
  } catch {
    return null;
  }
}

export interface NewSession {
  token: string;
  sessionId: string;
  expiresAtSeconds: number;
}

/** Create a customer session: store {sessionId -> customerId} in KV, return the signed cookie token. */
export async function createCustomerSession(
  kv: KVLike,
  sessionSecret: string,
  customerId: string,
  now: () => Date = () => new Date(),
): Promise<NewSession> {
  const sessionId = randomToken();
  const expiresAtSeconds = Math.floor(now().getTime() / 1000) + SESSION_TTL_SECONDS;
  await kv.put(`${SESSION_PREFIX}${sessionId}`, customerId, {
    expirationTtl: SESSION_TTL_SECONDS,
  });
  const token = await signSession({ sub: sessionId, exp: expiresAtSeconds, ver: 1 }, sessionSecret);
  return { token, sessionId, expiresAtSeconds };
}

/** Verify a session token: HMAC + expiry valid AND the KV record exists. Returns the customer + session ids. */
export async function verifyCustomerSession(
  token: string | null | undefined,
  kv: KVLike,
  sessionSecret: string,
  nowSeconds?: number,
): Promise<{ sessionId: string; customerId: string } | null> {
  if (!token) return null;
  const payload = await verifySession(token, sessionSecret, nowSeconds);
  if (!payload) return null;
  const customerId = await kv.get(`${SESSION_PREFIX}${payload.sub}`);
  if (!customerId) return null;
  return { sessionId: payload.sub, customerId };
}

/** Delete the session's KV record (logout). Returns the sessionId so the caller can clear the D1 row. */
export async function destroyCustomerSession(
  token: string | null | undefined,
  kv: KVLike,
  sessionSecret: string,
): Promise<string | null> {
  if (!token) return null;
  const payload = await verifySession(token, sessionSecret, 0);
  if (!payload) return null;
  await kv.delete(`${SESSION_PREFIX}${payload.sub}`);
  return payload.sub;
}

/** Delete a specific session's KV record by id (revoke-all during deletion). */
export async function deleteSessionKv(kv: KVLike, sessionId: string): Promise<void> {
  await kv.delete(`${SESSION_PREFIX}${sessionId}`);
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
