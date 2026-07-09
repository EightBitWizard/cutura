// Maps the stable English error tokens of /api/checkout to keys of the typed
// message catalog (CheckoutErrorMessages), so checkout failures surface in the
// customer's language. The API responses stay untouched; unknown tokens and
// network failures fall back to the generic message.

import type { CheckoutErrorMessages } from "./messages";

export type CheckoutErrorKey = keyof CheckoutErrorMessages;

const TOKEN_TO_KEY: Record<string, CheckoutErrorKey> = {
  "rate limited": "rateLimited",
  "bad request": "generic",
  "missing fields": "missingFields",
  "stale consent": "staleConsent",
  "empty cart": "emptyCart",
  "ordering paused": "orderingPaused",
  "invalid line": "invalidLine",
  "missing measurement": "missingMeasurement",
  "payment provider unavailable": "generic",
  "draft order failed": "generic",
};

/** The catalog key for a checkout API error token; unknown tokens map to "generic". */
export function checkoutErrorKey(token: string | null | undefined): CheckoutErrorKey {
  return (token && TOKEN_TO_KEY[token]) || "generic";
}
