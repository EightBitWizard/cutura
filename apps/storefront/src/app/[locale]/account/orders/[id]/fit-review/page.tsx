import { redirect } from "next/navigation";

import { defaultLocale, isLocale } from "@/i18n/config";
import { getOrderMessages } from "@/i18n/messages";
import { getCustomerId } from "@/server/session";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  reason: "reason",
  window: "window",
  already: "already",
  not_owner: "not_owner",
};

export default async function FitReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale: raw, id } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getOrderMessages(locale);
  if (!(await getCustomerId())) redirect(`/${locale}/account/login`);
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t.fitReview}</h1>
      {error && <p className="mt-2 text-sm text-warning">{ERRORS[error] ?? error}</p>}
      <form
        method="post"
        action="/api/account/fit-review"
        encType="multipart/form-data"
        className="mt-6 flex flex-col gap-3"
      >
        <input type="hidden" name="orderId" value={id} />
        <input type="hidden" name="locale" value={locale} />
        <label className="flex flex-col text-sm">
          {t.reasonLabel}
          <textarea
            name="reason"
            required
            rows={4}
            className="mt-1 rounded border border-line-strong px-2 py-1"
          />
        </label>
        <label className="flex flex-col text-sm">
          {t.photosLabel}
          <input type="file" name="photos" accept="image/*" multiple className="mt-1 text-sm" />
        </label>
        <button
          type="submit"
          className="self-start rounded-md bg-ink px-4 py-2 font-medium text-paper"
        >
          {t.submit}
        </button>
      </form>
    </main>
  );
}
