// Cookie/tracking consent (FR-1350). Pure. The cookie value is "all" (analytics
// opt-in) or "necessary" (declined); anything else is treated as undecided so the
// banner shows. Analytics must call hasAnalyticsConsent before loading - it is the
// single gate. Necessary cookies (session, cart, locale, consent) are always on.

export const CONSENT_COOKIE = "cutura_consent";

export interface ConsentState {
  necessary: true;
  analytics: boolean;
  decided: boolean;
}

export function parseConsent(raw: string | null | undefined): ConsentState {
  if (raw === "all") return { necessary: true, analytics: true, decided: true };
  if (raw === "necessary") return { necessary: true, analytics: false, decided: true };
  return { necessary: true, analytics: false, decided: false };
}

/** The single gate any analytics/pixel must pass before loading. */
export function hasAnalyticsConsent(raw: string | null | undefined): boolean {
  return parseConsent(raw).analytics;
}

/** Whether the visitor has answered the banner (controls whether it shows). */
export function isConsentDecided(raw: string | null | undefined): boolean {
  return parseConsent(raw).decided;
}
