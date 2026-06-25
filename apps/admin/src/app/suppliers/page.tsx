import Link from "next/link";

import { listSuppliers } from "@cutura/db";

import { environmentDb } from "@/server/catalog";

export const dynamic = "force-dynamic";

const input = "mt-1 rounded border border-line-strong px-2 py-1";

export default async function SuppliersPage() {
  // Suppliers live in the environment DB - the paid pipeline routes to the default here.
  const rows = await listSuppliers(environmentDb("staging"));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Suppliers</h1>
        <Link href="/" className="text-sm text-ink-muted underline">
          Dashboard
        </Link>
      </div>
      <p className="mt-2 text-sm text-ink-subtle">
        One supplier at launch; all production routes to the default (staging). The model supports
        more later.
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {rows.map((s) => (
          <li key={s.id} className="rounded-lg border border-line p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {s.name}
                {s.isDefault && <span className="ml-2 text-success">(default)</span>}
              </span>
              {!s.isDefault && (
                <form method="post" action={`/api/suppliers/${s.id}/default`}>
                  <button type="submit" className="rounded border border-line-strong px-2 py-1">
                    Set default
                  </button>
                </form>
              )}
            </div>
            {s.notes && <p className="mt-1 text-ink-subtle">{s.notes}</p>}
          </li>
        ))}
        {rows.length === 0 && <li className="text-sm text-ink-subtle">No suppliers yet.</li>}
      </ul>

      <h2 className="mt-10 text-lg font-medium">New supplier</h2>
      <form method="post" action="/api/suppliers" className="mt-4 grid max-w-xl grid-cols-2 gap-3">
        <label className="col-span-2 flex flex-col text-sm">
          Name
          <input name="name" required className={input} />
        </label>
        <label className="col-span-2 flex flex-col text-sm">
          Contact email
          <input name="contactEmail" type="email" className={input} />
        </label>
        <label className="col-span-2 flex flex-col text-sm">
          Notes
          <textarea name="notes" className={input} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input name="isDefault" type="checkbox" defaultChecked />
          Default supplier
        </label>
        <div className="col-span-2">
          <button type="submit" className="rounded-md bg-ink px-4 py-2 font-medium text-paper">
            Create supplier
          </button>
        </div>
      </form>
    </main>
  );
}
