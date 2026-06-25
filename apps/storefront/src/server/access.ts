import { signSession, timingSafeEqual, verifySession } from "@cutura/core";

// Staging access gate. The whole storefront is private when a SITE_PASSWORD secret is
// set (staging); production leaves it unset and stays public. Unlike HTTP Basic Auth,
// this is a normal password form (so password managers fill it) backed by a long-lived
// signed cookie (so it does not re-prompt). Stateless: the cookie is an HMAC-signed
// token (no KV), distinct from the customer session cookie and the admin's auth.

export const SITE_ACCESS_COOKIE = "cutura_site";
export const SITE_ACCESS_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Compare a submitted password to the configured site password, in constant time. */
export function checkSitePassword(password: string, secret: string): boolean {
  if (!secret || !password) return false;
  return timingSafeEqual(password, secret);
}

/** Sign a site-access cookie token (30-day expiry), signed with the site password. */
export function signSiteAccess(
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Promise<string> {
  return signSession({ sub: "site", exp: nowSeconds + SITE_ACCESS_MAX_AGE, ver: 1 }, secret);
}

/** True when the cookie token is a valid, unexpired site-access token. */
export async function hasSiteAccess(
  token: string | null | undefined,
  secret: string,
): Promise<boolean> {
  if (!token || !secret) return false;
  const payload = await verifySession(token, secret);
  return payload?.sub === "site";
}
