import type { ReactNode } from "react";

import Link from "next/link";
import { notFound } from "next/navigation";

import { ConsentBanner } from "@/components/ConsentBanner";
import { Footer } from "@/components/Footer";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { isLocale, locales } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

import "../globals.css";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getMessages(locale);

  return (
    <html lang={locale}>
      <body>
        <header className="border-b border-neutral-200">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
            <Link href={`/${locale}`} className="font-semibold tracking-tight">
              {t.brand}
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href={`/${locale}/discover`} className="text-neutral-600">
                {t.allModels}
              </Link>
              <LanguageSwitcher current={locale} />
            </nav>
          </div>
        </header>
        {children}
        <Footer locale={locale} contactLabel={t.contact} />
        <ConsentBanner
          messages={{ text: t.consentText, accept: t.consentAccept, decline: t.consentDecline }}
        />
      </body>
    </html>
  );
}
