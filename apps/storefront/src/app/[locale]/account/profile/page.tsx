import Link from "next/link";
import { redirect } from "next/navigation";

import { getCustomerProfileId, getDb, getProfile } from "@cutura/db";

import { defaultLocale, isLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { getEnv } from "@/server/env";
import { getCustomerId } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getMessages(locale);
  const customerId = await getCustomerId();
  if (!customerId) redirect(`/${locale}/account/login`);

  const env = getEnv();
  const db = getDb(env.DB);
  const profileId = await getCustomerProfileId(db, customerId);

  if (!profileId) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">{t.measure.fields.chest}</h1>
        <p className="mt-4 text-ink-muted">{t.cart.measurementMissing}</p>
        <Link
          href={`/${locale}/measure?return=/${locale}/account/profile`}
          className="mt-4 inline-block underline"
        >
          {t.cart.addMeasurement}
        </Link>
      </main>
    );
  }

  const profile = await getProfile(db, customerId, profileId, env.MEASUREMENT_ENCRYPTION_KEY);
  const values = (profile?.confirmed ?? {}) as unknown as Record<string, number>;
  const fields = t.measure.fields;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t.measure.title}</h1>
        <Link href={`/${locale}/account`} className="text-sm text-ink-muted underline">
          {t.back}
        </Link>
      </div>
      <p className="mt-1 text-sm text-ink-subtle">{profile?.name ?? "-"}</p>

      <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
        {(Object.keys(fields) as Array<keyof typeof fields>).map((f) => (
          <div key={f} className="flex justify-between border-b py-1">
            <dt className="text-ink-subtle">{fields[f]}</dt>
            <dd>{values[f] ?? "-"} cm</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/${locale}/account/profile/edit`}
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper"
        >
          {t.measure.confirm}
        </Link>
      </div>

      <form method="post" action="/api/account/profile" className="mt-6 flex items-end gap-2">
        <input type="hidden" name="action" value="rename" />
        <input type="hidden" name="profileId" value={profileId} />
        <input type="hidden" name="locale" value={locale} />
        <label className="flex flex-col text-sm">
          {t.measure.title}
          <input
            name="name"
            defaultValue={profile?.name ?? ""}
            className="mt-1 rounded border border-line-strong px-2 py-1"
          />
        </label>
        <button type="submit" className="rounded border border-line-strong px-3 py-2 text-sm">
          {t.measure.confirm}
        </button>
      </form>

      <form method="post" action="/api/account/profile" className="mt-3">
        <input type="hidden" name="action" value="archive" />
        <input type="hidden" name="profileId" value={profileId} />
        <input type="hidden" name="locale" value={locale} />
        <button type="submit" className="text-sm text-ink-subtle underline">
          {t.cart.remove}
        </button>
      </form>
    </main>
  );
}
