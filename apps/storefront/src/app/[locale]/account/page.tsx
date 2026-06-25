import Link from "next/link";

import { getDb, getRecommendations } from "@cutura/db";

import { RecommendedSection } from "@/components/RecommendedSection";
import { defaultLocale, isLocale } from "@/i18n/config";
import { getAccountMessages, getMessages } from "@/i18n/messages";
import { getEnv } from "@/server/env";
import { getCustomerId } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getAccountMessages(locale);
  const tt = getMessages(locale);

  const customerId = await getCustomerId();
  const recommended = customerId
    ? await getRecommendations(getDb(getEnv().DB), locale, { customerId, limit: 3 })
    : [];

  const link = (path: string, label: string) => (
    <Link href={`/${locale}/account/${path}`} className="text-ink underline">
      {label}
    </Link>
  );

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
      <nav className="mt-6 flex flex-col gap-2">
        {link("profile", t.navProfile)}
        {link("orders", t.navOrders)}
        {link("addresses", t.navAddresses)}
        {link("privacy", t.navPrivacy)}
      </nav>
      <form method="post" action="/api/auth/logout" className="mt-10">
        <button type="submit" className="rounded border border-line-strong px-3 py-1 text-sm">
          {t.signOut}
        </button>
      </form>

      <RecommendedSection
        locale={locale}
        heading={tt.recommendedForYou}
        models={recommended}
        fromLabel={tt.from}
        notifyLabel={tt.notifyMe}
      />
    </main>
  );
}
