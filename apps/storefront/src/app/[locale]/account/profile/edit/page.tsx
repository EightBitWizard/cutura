import Link from "next/link";
import { redirect } from "next/navigation";

import { getCustomerProfileId, getDb, getProfile } from "@cutura/db";

import { defaultLocale, isLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { getEnv } from "@/server/env";
import { getCustomerId } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function ProfileEditPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getMessages(locale);
  const customerId = await getCustomerId();
  if (!customerId) redirect(`/${locale}/account/login`);

  const env = getEnv();
  const db = getDb(env.DB);
  const profileId = await getCustomerProfileId(db, customerId);
  if (!profileId) redirect(`/${locale}/account/profile`);

  const profile = await getProfile(db, customerId, profileId, env.MEASUREMENT_ENCRYPTION_KEY);
  const values = (profile?.confirmed ?? {}) as unknown as Record<string, number>;
  const fields = t.measure.fields;

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t.measure.detailedTitle}</h1>
      <Link href={`/${locale}/account/profile`} className="text-sm text-neutral-600 underline">
        {t.back}
      </Link>
      <form method="post" action="/api/account/profile" className="mt-6 grid grid-cols-2 gap-3">
        <input type="hidden" name="action" value="revise" />
        <input type="hidden" name="profileId" value={profileId} />
        <input type="hidden" name="locale" value={locale} />
        {(Object.keys(fields) as Array<keyof typeof fields>).map((f) => (
          <label key={f} className="flex flex-col text-sm">
            {fields[f]}
            <input
              name={f}
              type="number"
              inputMode="decimal"
              defaultValue={values[f] ?? ""}
              className="mt-1 rounded border border-neutral-300 px-2 py-1"
            />
          </label>
        ))}
        <div className="col-span-2">
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white"
          >
            {t.measure.confirm}
          </button>
        </div>
      </form>
    </main>
  );
}
