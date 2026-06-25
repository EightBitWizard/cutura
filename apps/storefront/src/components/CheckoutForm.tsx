"use client";

import { useState } from "react";

import { buttonClasses } from "@/components/ui/buttonClasses";
import type { CheckoutMessages } from "@/i18n/messages";

const input =
  "mt-1 w-full rounded-sm border border-line-strong bg-surface px-3 py-2 text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-paper";

export function CheckoutForm({
  locale,
  messages: t,
  ready,
  termsVersion,
  privacyVersion,
}: {
  locale: string;
  messages: CheckoutMessages;
  ready: boolean;
  termsVersion: string;
  privacyVersion: string;
}) {
  const [email, setEmail] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState<"CH" | "LI">("CH");
  const [phone, setPhone] = useState("");
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = ready && terms && privacy && email.length > 3 && line1 && city && zip;

  async function submit() {
    if (!terms || !privacy) {
      setError(t.mustAccept);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          locale,
          email,
          address: { line1, city, zip, country },
          phone: phone || null,
          acceptedTermsVersion: termsVersion,
          acceptedPrivacyVersion: privacyVersion,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        checkoutUrl?: string;
        error?: string;
      } | null;
      if (res.ok && data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      setError(data?.error ?? "checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="mt-6 flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        {t.email}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={input}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        {t.line1}
        <input value={line1} onChange={(e) => setLine1(e.target.value)} className={input} />
      </label>
      <div className="grid grid-cols-3 gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          {t.zip}
          <input value={zip} onChange={(e) => setZip(e.target.value)} className={input} />
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-sm font-medium text-ink">
          {t.city}
          <input value={city} onChange={(e) => setCity(e.target.value)} className={input} />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        {t.country}
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value as "CH" | "LI")}
          className={input}
        >
          <option value="CH">CH</option>
          <option value="LI">LI</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        {t.phoneOptional}
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className={input} />
      </label>

      <label className="mt-2 flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
          className="h-4 w-4 accent-ink"
        />
        {t.acceptTerms}
      </label>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={privacy}
          onChange={(e) => setPrivacy(e.target.checked)}
          className="h-4 w-4 accent-ink"
        />
        {t.acceptPrivacy}
      </label>

      {error && <p className="text-sm text-accent">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className={buttonClasses("primary", "lg", "mt-2 w-full")}
      >
        {submitting ? t.redirecting : t.placeOrder}
      </button>
    </form>
  );
}
