import { redirect } from "next/navigation";

import { defaultLocale, isLocale } from "@/i18n/config";
import { getOrderMessages } from "@/i18n/messages";
import { getCustomerId } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getOrderMessages(locale);
  if (!(await getCustomerId())) redirect(`/${locale}/account/login`);

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t.feedback}</h1>
      <form method="post" action="/api/account/feedback" className="mt-6 flex flex-col gap-3">
        <input type="hidden" name="orderId" value={id} />
        <input type="hidden" name="locale" value={locale} />
        <label className="flex flex-col text-sm">
          {t.ratingLabel}
          <input
            name="overallRating"
            type="number"
            min={1}
            max={5}
            required
            className="mt-1 w-24 rounded border border-line-strong px-2 py-1"
          />
        </label>
        <label className="flex flex-col text-sm">
          {t.reasonLabel}
          <textarea
            name="notes"
            rows={3}
            className="mt-1 rounded border border-line-strong px-2 py-1"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="wantsRemake" />
          {t.fitReview}
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
