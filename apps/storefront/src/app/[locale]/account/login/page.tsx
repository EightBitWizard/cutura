import { LoginForm } from "@/components/LoginForm";
import { defaultLocale, isLocale } from "@/i18n/config";
import { getAccountMessages } from "@/i18n/messages";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getAccountMessages(locale);
  const { error } = await searchParams;
  const errMsg =
    error === "expired"
      ? t.errExpired
      : error === "disabled"
        ? t.errDisabled
        : error === "throttled"
          ? t.errThrottled
          : null;

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">{t.loginTitle}</h1>
      <p className="mt-2 text-neutral-600">{t.loginIntro}</p>
      {errMsg && <p className="mt-4 text-sm text-amber-700">{errMsg}</p>}
      <LoginForm locale={locale} messages={t} />
    </main>
  );
}
