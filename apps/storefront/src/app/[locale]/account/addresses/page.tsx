import Link from "next/link";
import { redirect } from "next/navigation";

import { getDb, listAddresses } from "@cutura/db";

import { defaultLocale, isLocale } from "@/i18n/config";
import { getAccountMessages, getMessages } from "@/i18n/messages";
import { getEnv } from "@/server/env";
import { getCustomerId } from "@/server/session";

export const dynamic = "force-dynamic";

const input = "mt-1 w-full rounded border border-line-strong px-2 py-1";

export default async function AddressesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const a = getAccountMessages(locale);
  const t = getMessages(locale);
  const customerId = await getCustomerId();
  if (!customerId) redirect(`/${locale}/account/login`);

  const addresses = await listAddresses(getDb(getEnv().DB), customerId);

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{a.navAddresses}</h1>
        <Link href={`/${locale}/account`} className="text-sm text-ink-muted underline">
          {t.back}
        </Link>
      </div>

      <ul className="mt-6 flex flex-col gap-3">
        {addresses.map((addr) => (
          <li key={addr.id} className="rounded-lg border border-line p-4 text-sm">
            <div className="flex items-start justify-between">
              <div>
                <p>{addr.line1}</p>
                {addr.line2 && <p>{addr.line2}</p>}
                <p>
                  {addr.zip} {addr.city} ({addr.country})
                </p>
                {addr.isDefault && <p className="mt-1 text-ink-subtle">{a.defaultLabel}</p>}
              </div>
              <div className="flex gap-2">
                {!addr.isDefault && (
                  <form method="post" action="/api/account/addresses">
                    <input type="hidden" name="action" value="default" />
                    <input type="hidden" name="addressId" value={addr.id} />
                    <input type="hidden" name="locale" value={locale} />
                    <button type="submit" className="rounded border border-line-strong px-2 py-1">
                      {a.makeDefault}
                    </button>
                  </form>
                )}
                <form method="post" action="/api/account/addresses">
                  <input type="hidden" name="action" value="delete" />
                  <input type="hidden" name="addressId" value={addr.id} />
                  <input type="hidden" name="locale" value={locale} />
                  <button type="submit" className="text-ink-subtle underline">
                    {t.cart.remove}
                  </button>
                </form>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-lg font-medium">{a.addAddress}</h2>
      <form method="post" action="/api/account/addresses" className="mt-3 grid grid-cols-2 gap-3">
        <input type="hidden" name="action" value="create" />
        <input type="hidden" name="locale" value={locale} />
        <label className="col-span-2 flex flex-col text-sm">
          {t.checkout.line1}
          <input name="line1" required className={input} />
        </label>
        <label className="flex flex-col text-sm">
          {t.checkout.zip}
          <input name="zip" required className={input} />
        </label>
        <label className="flex flex-col text-sm">
          {t.checkout.city}
          <input name="city" required className={input} />
        </label>
        <label className="flex flex-col text-sm">
          {t.checkout.country}
          <select name="country" className={input}>
            <option value="CH">CH</option>
            <option value="LI">LI</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isDefault" />
          {a.defaultLabel}
        </label>
        <div className="col-span-2">
          <button type="submit" className="rounded-md bg-ink px-4 py-2 font-medium text-paper">
            {a.addAddress}
          </button>
        </div>
      </form>
    </main>
  );
}
