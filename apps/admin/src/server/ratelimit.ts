import type { KVLike } from "./auth";

// Fixed-window KV rate limiter. Returns true if the call is allowed. Good enough
// to throttle the admin login; not a precise distributed limiter.
export async function rateLimit(
  kv: KVLike,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const k = `rl:${key}`;
  const current = Number.parseInt((await kv.get(k)) ?? "0", 10);
  if (current >= limit) return false;
  await kv.put(k, String(current + 1), { expirationTtl: windowSeconds });
  return true;
}
