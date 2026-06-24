"use client";

import { useEffect, useRef } from "react";

import { CONSENT_COOKIE, hasAnalyticsConsent } from "@cutura/core";

// Fires a consent-gated "view" signal for a model (FR-1120). Reads the consent
// cookie client-side and does nothing without analytics consent; the server
// re-checks consent too.
export function ViewSignal({ entityId }: { entityId: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const consent = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${CONSENT_COOKIE}=`))
      ?.split("=")[1];
    if (!hasAnalyticsConsent(consent)) return;
    void fetch("/api/signal", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ signalType: "view", entityType: "model", entityId }),
    });
  }, [entityId]);
  return null;
}
