"use client";

import { useState } from "react";

import { buttonClasses } from "@/components/ui/buttonClasses";
import type { AccountMessages } from "@/i18n/messages";

const input =
  "mt-1 w-full rounded-sm border border-line-strong bg-surface px-3 py-2 text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-paper";

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
        <p className="text-ink">{t.linkSent}</p>
        {devUrl && (
          <p className="mt-3 text-sm">
            <a href={devUrl} className="text-ink underline">
              dev sign-in link
            </a>
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 max-w-sm">
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        {t.emailLabel}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={input}
        />
      </label>
      <button type="submit" disabled={busy} className={buttonClasses("primary", "md", "mt-4")}>
        {t.sendLink}
      </button>
    </form>
  );
}
