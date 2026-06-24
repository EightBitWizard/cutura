// Server-owned guest cart in KV (SESSIONS), keyed by a `cutura_cart` HttpOnly
// cookie. The cart stores only selection codes + quantities + an optional
// per-piece override - never prices (those are recomputed from the catalog on
// every read and at checkout, FR-7J0) and no body measurements (those live in the
// separate encrypted measurement store; the order uses the current measurement at
// checkout).

import { randomToken } from "@cutura/core";

import { getEnv } from "./env";

export const CART_COOKIE = "cutura_cart";
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const kvKey = (token: string) => `cart:${token}`;

export interface CartLine {
  handle: string;
  fabricCode: string | null;
  optionValueCodes: string[];
  upgradeCodes: string[];
  /** Per-piece measurement deltas in cm (advanced; applied to this garment only). */
  perPieceOverride?: Record<string, number>;
  qty: number;
}

export interface Cart {
  lines: CartLine[];
}

export function newCartToken(): string {
  return randomToken(18);
}

export function readCartToken(cookieHeader: string | null): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === CART_COOKIE) return rest.join("=") || undefined;
  }
  return undefined;
}

export function cartCookie(token: string): string {
  return `${CART_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${TTL_SECONDS}`;
}

export async function readCart(token: string | undefined): Promise<Cart> {
  if (!token) return { lines: [] };
  const raw = await getEnv().SESSIONS.get(kvKey(token));
  if (!raw) return { lines: [] };
  try {
    const parsed = JSON.parse(raw) as Cart;
    return Array.isArray(parsed.lines) ? parsed : { lines: [] };
  } catch {
    return { lines: [] };
  }
}

export async function writeCart(token: string, cart: Cart): Promise<void> {
  await getEnv().SESSIONS.put(kvKey(token), JSON.stringify(cart), { expirationTtl: TTL_SECONDS });
}
