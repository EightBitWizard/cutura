"use client";

import { useState, useSyncExternalStore } from "react";

import { CONSENT_COOKIE, isConsentDecided } from "@cutura/core";

function readCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`))
    ?.split("=")[1];
}

// The cookie never changes reactively; no subscription needed.
const noopSubscribe = () => () => {};

// Cookie/tracking consent banner (FR-1350). Shows until the visitor decides; the
// choice is stored in the cutura_consent cookie. No analytics is loaded anywhere
// until hasAnalyticsConsent() passes, so declining is the safe default. Reading the
// cookie via useSyncExternalStore avoids a hydration flash + setState-in-effect.
export function ConsentBanner({
  messages,
}: {
  messages: { text: string; accept: string; decline: string };
}) {
  const decided = useSyncExternalStore(
    noopSubscribe,
    () => isConsentDecided(readCookie(CONSENT_COOKIE)),
    () => true, // server: treat as decided so nothing renders during SSR/hydration
  );
  const [dismissed, setDismissed] = useState(false);
  if (decided || dismissed) return null;

  const choose = (value: "all" | "necessary") => {
    document.cookie = `${CONSENT_COOKIE}=${value};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    setDismissed(true);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white p-4 shadow">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-neutral-700">{messages.text}</p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose("necessary")}
            className="rounded border border-neutral-300 px-3 py-1.5"
          >
            {messages.decline}
          </button>
          <button
            type="button"
            onClick={() => choose("all")}
            className="rounded bg-neutral-900 px-3 py-1.5 text-white"
          >
            {messages.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
