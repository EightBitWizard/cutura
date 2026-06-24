"use client";

import { useState } from "react";

import type { CheckoutMessages } from "@/i18n/messages";

const input = "mt-1 w-full rounded border border-neutral-300 px-2 py-1";

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
      <label className="flex flex-col text-sm">
        {t.email}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={input}
        />
      </label>
      <label className="flex flex-col text-sm">
        {t.line1}
        <input value={line1} onChange={(e) => setLine1(e.target.value)} className={input} />
      </label>
      <div className="grid grid-cols-3 gap-3">
        <label className="flex flex-col text-sm">
          {t.zip}
          <input value={zip} onChange={(e) => setZip(e.target.value)} className={input} />
        </label>
        <label className="col-span-2 flex flex-col text-sm">
          {t.city}
          <input value={city} onChange={(e) => setCity(e.target.value)} className={input} />
        </label>
      </div>
      <label className="flex flex-col text-sm">
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
      <label className="flex flex-col text-sm">
        {t.phoneOptional}
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className={input} />
      </label>

      <label className="mt-2 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
        {t.acceptTerms}
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} />
        {t.acceptPrivacy}
      </label>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className="mt-2 rounded-md bg-neutral-900 px-4 py-3 font-medium text-white disabled:opacity-40"
      >
        {submitting ? t.redirecting : t.placeOrder}
      </button>
    </form>
  );
}
