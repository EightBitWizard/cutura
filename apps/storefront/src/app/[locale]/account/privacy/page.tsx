import Link from "next/link";
import { redirect } from "next/navigation";

import { defaultLocale, isLocale } from "@/i18n/config";
import { getAccountMessages } from "@/i18n/messages";
import { getCustomerId } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getAccountMessages(locale);
  if (!(await getCustomerId())) redirect(`/${locale}/account/login`);

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t.navPrivacy}</h1>
        <Link href={`/${locale}/account`} className="text-sm text-ink-muted underline">
          {t.title}
        </Link>
      </div>

      <form method="post" action="/api/account/privacy" className="mt-6">
        <input type="hidden" name="action" value="export" />
        <input type="hidden" name="locale" value={locale} />
        <button type="submit" className="rounded-md border border-line-strong px-4 py-2 text-sm">
          {t.exportData}
        </button>
      </form>

      <div className="mt-10 rounded-lg border border-accent/40 bg-accent/5 p-4">
        <p className="text-sm text-accent-strong">{t.deleteWarning}</p>
        <form method="post" action="/api/account/privacy" className="mt-3">
          <input type="hidden" name="action" value="delete" />
          <input type="hidden" name="locale" value={locale} />
          <button
            type="submit"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-paper"
          >
            {t.deleteData}
          </button>
        </form>
      </div>
    </main>
  );
}
