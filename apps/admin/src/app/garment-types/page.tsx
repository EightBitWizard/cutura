import Link from "next/link";

import { garmentType, incompleteLocales, listRows } from "@cutura/db";

import { controlDb } from "@/server/catalog";

export const dynamic = "force-dynamic";

export default async function GarmentTypesPage() {
  const rows = await listRows(controlDb(), garmentType);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Garment types</h1>
        <Link href="/" className="text-sm text-ink-muted underline">
          Dashboard
        </Link>
      </div>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left text-ink-subtle">
            <th className="py-2">Key</th>
            <th className="py-2">Name (DE)</th>
            <th className="py-2">Locales</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-6 text-ink-subtle">
                No garment types yet. Create one below.
              </td>
            </tr>
          ) : (
            rows.map((g) => {
              const missing = incompleteLocales(g.nameI18n);
              return (
                <tr key={g.id} className="border-b align-top">
                  <td className="py-3 font-mono">{g.key}</td>
                  <td className="py-3">{g.nameI18n.de}</td>
                  <td className="py-3 text-ink-subtle">
                    {missing.length === 0 ? "complete" : `missing: ${missing.join(", ")}`}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <form method="post" action="/api/catalog/publish">
                        <input type="hidden" name="entityType" value="garmentType" />
                        <input type="hidden" name="entityId" value={g.id} />
                        <input type="hidden" name="environment" value="staging" />
                        <input type="hidden" name="back" value="/garment-types" />
                        <button type="submit" className="rounded bg-ink px-2 py-1 text-paper">
                          Publish to staging
                        </button>
                      </form>
                      <form method="post" action={`/api/catalog/garment-types/${g.id}/delete`}>
                        <button
                          type="submit"
                          className="rounded border border-line-strong px-2 py-1"
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

      <h2 className="mt-10 text-lg font-medium">New garment type</h2>
      <form
        method="post"
        action="/api/catalog/garment-types"
        className="mt-4 grid max-w-xl grid-cols-2 gap-3"
      >
        <label className="col-span-2 flex flex-col text-sm">
          Key (e.g. shirt, trouser)
          <input name="key" required className="mt-1 rounded border border-line-strong px-2 py-1" />
        </label>
        <label className="flex flex-col text-sm">
          Name (DE)
          <input
            name="name_de"
            required
            className="mt-1 rounded border border-line-strong px-2 py-1"
          />
        </label>
        <label className="flex flex-col text-sm">
          Name (EN)
          <input name="name_en" className="mt-1 rounded border border-line-strong px-2 py-1" />
        </label>
        <label className="flex flex-col text-sm">
          Name (IT)
          <input name="name_it" className="mt-1 rounded border border-line-strong px-2 py-1" />
        </label>
        <label className="flex flex-col text-sm">
          Name (FR)
          <input name="name_fr" className="mt-1 rounded border border-line-strong px-2 py-1" />
        </label>
        <div className="col-span-2">
          <button type="submit" className="rounded-md bg-ink px-4 py-2 font-medium text-paper">
            Create garment type
          </button>
        </div>
      </form>
    </main>
  );
}
