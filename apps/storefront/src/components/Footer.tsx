import Link from "next/link";

import type { Locale } from "@/i18n/config";
import { getFooterMessages, getMessages } from "@/i18n/messages";

import { Container } from "./ui/Container";
import { Eyebrow } from "./ui/Eyebrow";

// Hardcoded footer nav at launch (FR-372 editable nav is Future). Links the legal
// and content pages (rendered from the DB) with localized labels.
export function Footer({ locale }: { locale: Locale }) {
  const t = getMessages(locale);
  const f = getFooterMessages(locale);

  const help: { href: string; label: string }[] = [
    { href: `/${locale}/content/about`, label: f.about },
    { href: `/${locale}/content/faq`, label: f.faq },
    { href: `/${locale}/contact`, label: f.contact },
  ];
  const legal: { href: string; label: string }[] = [
    { href: `/${locale}/legal/imprint`, label: f.imprint },
    { href: `/${locale}/legal/terms`, label: f.terms },
    { href: `/${locale}/legal/privacy`, label: f.privacy },
    { href: `/${locale}/legal/shipping`, label: f.shipping },
    { href: `/${locale}/legal/fit-guarantee`, label: f.fitGuarantee },
  ];

  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <Container className="py-12">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <p className="text-base font-semibold tracking-tight text-ink">{t.brand}</p>
            <p className="mt-3 max-w-xs text-sm text-ink-muted">{t.tagline}</p>
          </div>
          <nav aria-label={f.helpHeading}>
            <Eyebrow>{f.helpHeading}</Eyebrow>
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {help.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-ink-muted transition-colors hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label={f.legalHeading}>
            <Eyebrow>{f.legalHeading}</Eyebrow>
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {legal.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-ink-muted transition-colors hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <p className="mt-12 text-eyebrow uppercase text-ink-subtle">
          {t.brand} - {new Date().getFullYear()}
        </p>
      </Container>
    </footer>
  );
}
