import type { Metadata } from "next";
import Link from "next/link";

import { buildAlternates } from "@cutura/core";

import { defaultLocale, isLocale, locales } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  return {
    title: getMessages(locale).contact,
    alternates: buildAlternates("/contact", locale, locales, defaultLocale),
  };
}

const input = "mt-1 w-full rounded border border-line-strong px-3 py-2";

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getMessages(locale);
  const { sent, error } = await searchParams;

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">{t.contact}</h1>
      <Link
        href={`/${locale}/content/faq`}
        className="mt-1 inline-block text-sm text-ink-subtle underline"
      >
        {t.help}
      </Link>

      {sent ? (
        <p className="mt-6 rounded-lg border border-success/40 bg-success/10 p-4 text-success">
          {t.contactSent}
        </p>
      ) : (
        <form method="post" action="/api/contact" className="mt-6 flex flex-col gap-3">
          <input type="hidden" name="locale" value={locale} />
          {error && <p className="text-sm text-warning">{t.selectRequired}</p>}
          <label className="text-sm">
            {t.contactName}
            <input name="name" required className={input} />
          </label>
          <label className="text-sm">
            {t.checkout.email}
            <input name="email" type="email" required className={input} />
          </label>
          <label className="text-sm">
            {t.contactMessageLabel}
            <textarea name="message" rows={5} required className={input} />
          </label>
          <button
            type="submit"
            className="self-start rounded-md bg-ink px-4 py-2 font-medium text-paper"
          >
            {t.contactSend}
          </button>
        </form>
      )}
    </main>
  );
}
