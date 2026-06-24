import Link from "next/link";

import type { Locale } from "@/i18n/config";

// Hardcoded footer nav at launch (FR-372 editable nav is Future). Links the legal
// + content pages (rendered from the DB) and contact.
const LEGAL = ["imprint", "terms", "privacy", "shipping", "fit-guarantee"];
const CONTENT = ["about", "faq"];

export function Footer({ locale, contactLabel }: { locale: Locale; contactLabel: string }) {
  return (
    <footer className="mt-16 border-t border-neutral-200">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-8 text-sm text-neutral-500">
        <nav className="flex flex-wrap gap-x-4 gap-y-1">
          {CONTENT.map((slug) => (
            <Link key={slug} href={`/${locale}/content/${slug}`} className="hover:text-neutral-900">
              {slug}
            </Link>
          ))}
          <Link href={`/${locale}/contact`} className="hover:text-neutral-900">
            {contactLabel}
          </Link>
        </nav>
        <nav className="flex flex-wrap gap-x-4 gap-y-1">
          {LEGAL.map((slug) => (
            <Link key={slug} href={`/${locale}/legal/${slug}`} className="hover:text-neutral-900">
              {slug}
            </Link>
          ))}
        </nav>
        <p className="mt-2">CUTURA</p>
      </div>
    </footer>
  );
}
