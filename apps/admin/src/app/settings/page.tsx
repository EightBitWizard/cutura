import Link from "next/link";

import { getOperationsSettings } from "@cutura/db";

import { environmentDb, parseEnvironment } from "@/server/catalog";

export const dynamic = "force-dynamic";

const input = "mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ env?: string; saved?: string }>;
}) {
  const { env: envRaw, saved } = await searchParams;
  const environment = parseEnvironment(envRaw ?? null);
  const s = await getOperationsSettings(environmentDb(environment));

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Operations settings</h1>
        <Link href="/" className="text-sm text-neutral-600 underline">
          Dashboard
        </Link>
      </div>
      <p className="mt-1 text-sm text-neutral-500">Environment: {environment}</p>
      {saved && <p className="mt-2 text-sm text-green-700">Saved.</p>}

      <form method="post" action="/api/settings" className="mt-6 flex flex-col gap-5">
        <input type="hidden" name="environment" value={environment} />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="paused" defaultChecked={s.paused} />
          Pause new orders now
        </label>

        <label className="block text-sm">
          Capacity cap (open orders; blank = no cap)
          <input
            name="capacityCap"
            type="number"
            min={0}
            defaultValue={s.capacityCap ?? ""}
            className={input}
          />
        </label>

        <label className="block text-sm">
          Admin notification email (new order / needs review / QC due)
          <input
            name="adminEmail"
            type="email"
            defaultValue={s.adminEmail ?? ""}
            className={input}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Vacation from
            <input
              name="vacationFrom"
              type="date"
              defaultValue={s.vacationFrom ?? ""}
              className={input}
            />
          </label>
          <label className="block text-sm">
            Vacation until
            <input
              name="vacationUntil"
              type="date"
              defaultValue={s.vacationUntil ?? ""}
              className={input}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Lead-time buffer (days)
            <input
              name="leadTimeBufferDays"
              type="number"
              min={0}
              defaultValue={s.leadTimeBufferDays}
              className={input}
            />
          </label>
          <label className="block text-sm">
            High-water fraction (0-1)
            <input
              name="capacityHighWaterFraction"
              type="number"
              min={0}
              max={1}
              step={0.05}
              defaultValue={s.capacityHighWaterFraction}
              className={input}
            />
          </label>
        </div>

        <fieldset className="rounded border border-neutral-200 p-3">
          <legend className="px-1 text-sm font-medium">Pause message shown to customers</legend>
          {(["de", "en", "it", "fr"] as const).map((l) => (
            <label key={l} className="mt-2 block text-sm">
              {l.toUpperCase()}
              <textarea
                name={`pause${l.charAt(0).toUpperCase()}${l.slice(1)}`}
                rows={2}
                defaultValue={s.pauseMessage[l] ?? ""}
                className={input}
              />
            </label>
          ))}
        </fieldset>

        <button
          type="submit"
          className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          Save settings
        </button>
      </form>
    </main>
  );
}
