import Link from "next/link";

import { listShipping } from "@cutura/db";

import { environmentDb } from "@/server/catalog";

export const dynamic = "force-dynamic";

const input = "mt-1 rounded border border-line-strong px-2 py-1";

export default async function ShippingPage() {
  const zones = await listShipping(environmentDb("staging"));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Shipping</h1>
        <Link href="/" className="text-sm text-ink-muted underline">
          Dashboard
        </Link>
      </div>
      <p className="mt-2 text-sm text-ink-subtle">
        Zones and methods. Standard shipping is included in the displayed price.
      </p>

      <ul className="mt-6 flex flex-col gap-4">
        {zones.map(({ zone, methods }) => (
          <li key={zone.id} className="rounded-lg border border-line p-4 text-sm">
            <p className="font-medium">
              {zone.name} ({(zone.countries ?? []).join(", ")})
            </p>
            <ul className="mt-1 text-ink-muted">
              {methods.map((m) => (
                <li key={m.id}>
                  {m.code} - {m.kind} - {(m.priceMinor / 100).toFixed(2)} CHF
                  {m.includedInPrice ? " (included)" : ""}
                </li>
              ))}
            </ul>
            <form
              method="post"
              action="/api/shipping/method"
              className="mt-3 flex flex-wrap items-end gap-2"
            >
              <input type="hidden" name="zoneId" value={zone.id} />
              <label className="flex flex-col text-xs">
                Code
                <input name="code" required className={input} />
              </label>
              <label className="flex flex-col text-xs">
                Kind
                <select name="kind" className={input} defaultValue="standard">
                  <option value="standard">standard</option>
                  <option value="express">express</option>
                </select>
              </label>
              <label className="flex flex-col text-xs">
                Price (Rappen)
                <input name="priceMinor" type="number" min={0} defaultValue={0} className={input} />
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input name="includedInPrice" type="checkbox" defaultChecked />
                Included
              </label>
              <button type="submit" className="rounded border border-line-strong px-2 py-1 text-sm">
                Add method
              </button>
            </form>
          </li>
        ))}
        {zones.length === 0 && <li className="text-sm text-ink-subtle">No zones yet.</li>}
      </ul>

      <h2 className="mt-10 text-lg font-medium">New zone</h2>
      <form
        method="post"
        action="/api/shipping/zone"
        className="mt-3 flex flex-wrap items-end gap-2"
      >
        <label className="flex flex-col text-sm">
          Name
          <input name="name" required className={input} />
        </label>
        <label className="flex flex-col text-sm">
          Countries (comma-separated, e.g. CH, LI)
          <input name="countries" required className={input} />
        </label>
        <button
          type="submit"
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper"
        >
          Create zone
        </button>
      </form>
    </main>
  );
}
