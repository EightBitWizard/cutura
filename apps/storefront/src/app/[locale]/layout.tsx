import type { ReactNode } from "react";

import { Inter } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getDb, getOperationsSettings } from "@cutura/db";

import { ConsentBanner } from "@/components/ConsentBanner";
import { Footer } from "@/components/Footer";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NavLink } from "@/components/NavLink";
import { isLocale, locales } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { getEnv } from "@/server/env";

import "../globals.css";

// Self-hosted at build time (no runtime Google fetch), Workers-safe. Exposed as a CSS
// variable that the design tokens reference for the whole site's typeface.
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

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

  // Maintenance mode (NFR-17): the whole storefront is offline; the admin app is a
  // separate worker and stays reachable, and /api routes are outside this layout.
  const settings = await getOperationsSettings(getDb(getEnv().DB));
  if (settings.maintenance) {
    return (
      <html lang={locale} className={inter.variable}>
        <body className="font-sans">
          <main className="mx-auto max-w-xl px-6 py-20 text-center">
            <h1 className="text-display">{t.maintenanceTitle}</h1>
            <p className="mt-3 text-ink-muted">{t.maintenanceBody}</p>
          </main>
        </body>
      </html>
    );
  }

  return (
    <html lang={locale} className={inter.variable}>
      <body className="font-sans">
        <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href={`/${locale}`} className="text-base font-semibold tracking-tight text-ink">
              {t.brand}
            </Link>
            <nav className="flex items-center gap-6">
              <NavLink href={`/${locale}/discover`}>{t.allModels}</NavLink>
              <LanguageSwitcher current={locale} />
            </nav>
          </div>
        </header>
        {children}
        <Footer locale={locale} />
        <ConsentBanner
          messages={{ text: t.consentText, accept: t.consentAccept, decline: t.consentDecline }}
        />
      </body>
    </html>
  );
}
