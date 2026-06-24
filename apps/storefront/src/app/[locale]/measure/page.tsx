import Link from "next/link";

import { MeasurementFlow } from "@/components/MeasurementFlow";
import { defaultLocale, isLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

export const dynamic = "force-dynamic";

export default async function MeasurePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ return?: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const { return: ret } = await searchParams;
  const t = getMessages(locale);
  // Only same-origin relative return paths (avoid open redirect).
  const returnUrl =
    typeof ret === "string" && ret.startsWith("/") && !ret.startsWith("//")
      ? ret
      : `/${locale}/cart`;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t.measure.title}</h1>
      <Link
        href={`/${locale}/content/fit-guide`}
        className="mt-1 inline-block text-sm text-neutral-500 underline"
      >
        {t.fitGuide}
      </Link>
      <MeasurementFlow locale={locale} messages={t.measure} returnUrl={returnUrl} />
    </main>
  );
}
