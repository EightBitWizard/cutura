import { timingSafeEqual } from "@cutura/core";

// Staging access gate (HTTP Basic Auth). The whole storefront is private when a
// SITE_PASSWORD secret is set (staging); production leaves it unset and stays public.
// The username is ignored; only the password is checked, in constant time. Returns
// false for a missing/non-Basic/malformed header or an empty configured password.
export function verifyBasicAuth(authHeader: string | null, password: string): boolean {
  if (!password) return false;
  if (!authHeader || !authHeader.startsWith("Basic ")) return false;
  let decoded: string;
  try {
    decoded = atob(authHeader.slice("Basic ".length).trim());
  } catch {
    return false;
  }
  const sep = decoded.indexOf(":");
  if (sep === -1) return false;
  const supplied = decoded.slice(sep + 1);
  return timingSafeEqual(supplied, password);
}
