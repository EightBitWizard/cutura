import { describe, expect, it } from "vitest";

import { checkoutErrorKey } from "./checkoutErrors";
import { getMessages } from "./messages";
import { locales } from "./config";

describe("checkoutErrorKey", () => {
  it("maps every known /api/checkout token to a specific catalog key", () => {
    expect(checkoutErrorKey("rate limited")).toBe("rateLimited");
    expect(checkoutErrorKey("missing fields")).toBe("missingFields");
    expect(checkoutErrorKey("stale consent")).toBe("staleConsent");
    expect(checkoutErrorKey("empty cart")).toBe("emptyCart");
    expect(checkoutErrorKey("ordering paused")).toBe("orderingPaused");
    expect(checkoutErrorKey("invalid line")).toBe("invalidLine");
    expect(checkoutErrorKey("missing measurement")).toBe("missingMeasurement");
  });

  it("maps payment-rail failures and malformed requests to the generic message", () => {
    expect(checkoutErrorKey("payment provider unavailable")).toBe("generic");
    expect(checkoutErrorKey("draft order failed")).toBe("generic");
    expect(checkoutErrorKey("bad request")).toBe("generic");
  });

  it("falls back to generic for unknown, empty, and missing tokens", () => {
    expect(checkoutErrorKey("some new token")).toBe("generic");
    expect(checkoutErrorKey("")).toBe("generic");
    expect(checkoutErrorKey(null)).toBe("generic");
    expect(checkoutErrorKey(undefined)).toBe("generic");
  });

  it("resolves to a non-empty customer-facing message in all four locales", () => {
    for (const locale of locales) {
      const errors = getMessages(locale).checkout.errors;
      for (const token of ["rate limited", "draft order failed", "unknown"]) {
        const text = errors[checkoutErrorKey(token)];
        expect(text.length).toBeGreaterThan(0);
        // Raw API tokens must never reach the customer.
        expect(text).not.toBe(token);
      }
    }
  });
});
