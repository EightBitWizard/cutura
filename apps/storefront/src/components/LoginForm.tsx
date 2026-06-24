"use client";

import { useState } from "react";

import type { AccountMessages } from "@/i18n/messages";

const input = "mt-1 w-full rounded border border-neutral-300 px-2 py-1";

export function LoginForm({ locale, messages: t }: { locale: string; messages: AccountMessages }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devUrl, setDevUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      const data = (await res.json().catch(() => ({}))) as { devMagicUrl?: string };
      setSent(true);
      if (data.devMagicUrl) setDevUrl(data.devMagicUrl);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-6">
        <p className="text-neutral-700">{t.linkSent}</p>
        {devUrl && (
          <p className="mt-3 text-sm">
            <a href={devUrl} className="underline">
              dev sign-in link
            </a>
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 max-w-sm">
      <label className="flex flex-col text-sm">
        {t.emailLabel}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={input}
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="mt-4 rounded-md bg-neutral-900 px-4 py-2 font-medium text-white disabled:opacity-40"
      >
        {t.sendLink}
      </button>
    </form>
  );
}
