import Link from "next/link";

import { formatCHF } from "@cutura/core";
import { incompleteLocales, listRows, upgrade } from "@cutura/db";

import { controlDb } from "@/server/catalog";

export const dynamic = "force-dynamic";

export default async function UpgradesPage() {
  const rows = await listRows(controlDb(), upgrade);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Upgrades</h1>
        <Link href="/" className="text-sm text-neutral-600 underline">
          Dashboard
        </Link>
      </div>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left text-neutral-500">
            <th className="py-2">Code</th>
            <th className="py-2">Name (DE)</th>
            <th className="py-2">Price</th>
            <th className="py-2">Placement</th>
            <th className="py-2">Locales</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-6 text-neutral-500">
                No upgrades yet. Create one below.
              </td>
            </tr>
          ) : (
            rows.map((u) => {
              const missing = incompleteLocales(u.nameI18n);
              return (
                <tr key={u.id} className="border-b align-top">
                  <td className="py-3 font-mono">{u.code}</td>
                  <td className="py-3">{u.nameI18n.de}</td>
                  <td className="py-3">{formatCHF(u.priceMinor)}</td>
                  <td className="py-3">{u.placement ?? "-"}</td>
                  <td className="py-3 text-neutral-500">
                    {missing.length === 0 ? "complete" : `missing: ${missing.join(", ")}`}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <form method="post" action="/api/catalog/publish">
                        <input type="hidden" name="entityType" value="upgrade" />
                        <input type="hidden" name="entityId" value={u.id} />
                        <input type="hidden" name="environment" value="staging" />
                        <input type="hidden" name="back" value="/upgrades" />
                        <button
                          type="submit"
                          className="rounded bg-neutral-900 px-2 py-1 text-white"
                        >
                          Publish to staging
                        </button>
                      </form>
                      <form method="post" action={`/api/catalog/upgrades/${u.id}/delete`}>
                        <button
                          type="submit"
                          className="rounded border border-neutral-300 px-2 py-1"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <h2 className="mt-10 text-lg font-medium">New upgrade</h2>
      <form
        method="post"
        action="/api/catalog/upgrades"
        className="mt-4 grid max-w-xl grid-cols-2 gap-3"
      >
        <label className="flex flex-col text-sm">
          Code
          <input
            name="code"
            required
            className="mt-1 rounded border border-neutral-300 px-2 py-1"
          />
        </label>
        <label className="flex flex-col text-sm">
          Placement (optional)
          <input name="placement" className="mt-1 rounded border border-neutral-300 px-2 py-1" />
        </label>
        <label className="flex flex-col text-sm">
          Name (DE)
          <input
            name="name_de"
            required
            className="mt-1 rounded border border-neutral-300 px-2 py-1"
          />
        </label>
        <label className="flex flex-col text-sm">
          Name (EN)
          <input name="name_en" className="mt-1 rounded border border-neutral-300 px-2 py-1" />
        </label>
        <label className="flex flex-col text-sm">
          Name (IT)
          <input name="name_it" className="mt-1 rounded border border-neutral-300 px-2 py-1" />
        </label>
        <label className="flex flex-col text-sm">
          Name (FR)
          <input name="name_fr" className="mt-1 rounded border border-neutral-300 px-2 py-1" />
        </label>
        <label className="flex flex-col text-sm">
          Price (Rappen)
          <input
            name="priceMinor"
            type="number"
            defaultValue={0}
            className="mt-1 rounded border border-neutral-300 px-2 py-1"
          />
        </label>
        <div className="col-span-2">
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white"
          >
            Create upgrade
          </button>
        </div>
      </form>
    </main>
  );
}
