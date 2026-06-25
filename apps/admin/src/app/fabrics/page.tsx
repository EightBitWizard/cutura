import Link from "next/link";

import { fabric, incompleteLocales, listRows } from "@cutura/db";

import { controlDb } from "@/server/catalog";

export const dynamic = "force-dynamic";

export default async function FabricsPage() {
  const fabrics = await listRows(controlDb(), fabric);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Fabrics</h1>
        <Link href="/" className="text-sm text-ink-muted underline">
          Dashboard
        </Link>
      </div>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left text-ink-subtle">
            <th className="py-2">Code</th>
            <th className="py-2">Name (DE)</th>
            <th className="py-2">Available</th>
            <th className="py-2">Locales</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {fabrics.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-6 text-ink-subtle">
                No fabrics yet. Create one below.
              </td>
            </tr>
          ) : (
            fabrics.map((f) => {
              const missing = incompleteLocales(f.nameI18n);
              return (
                <tr key={f.id} className="border-b align-top">
                  <td className="py-3 font-mono">{f.code}</td>
                  <td className="py-3">{f.nameI18n.de}</td>
                  <td className="py-3">{f.available ? "Yes" : "No"}</td>
                  <td className="py-3 text-ink-subtle">
                    {missing.length === 0 ? "complete" : `missing: ${missing.join(", ")}`}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/fabrics/${f.id}`}
                        className="rounded border border-line-strong px-2 py-1"
                      >
                        Images
                      </Link>
                      <form method="post" action="/api/catalog/publish">
                        <input type="hidden" name="entityType" value="fabric" />
                        <input type="hidden" name="entityId" value={f.id} />
                        <input type="hidden" name="environment" value="staging" />
                        <input type="hidden" name="back" value="/fabrics" />
                        <button type="submit" className="rounded bg-ink px-2 py-1 text-paper">
                          Publish to staging
                        </button>
                      </form>
                      <form method="post" action={`/api/catalog/fabrics/${f.id}/delete`}>
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

      <h2 className="mt-10 text-lg font-medium">New fabric</h2>
      <form
        method="post"
        action="/api/catalog/fabrics"
        className="mt-4 grid max-w-xl grid-cols-2 gap-3"
      >
        <label className="col-span-2 flex flex-col text-sm">
          Code
          <input
            name="code"
            required
            className="mt-1 rounded border border-line-strong px-2 py-1"
          />
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
        <label className="flex flex-col text-sm">
          Surcharge (Rappen)
          <input
            name="surchargeMinor"
            type="number"
            defaultValue={0}
            className="mt-1 rounded border border-line-strong px-2 py-1"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input name="available" type="checkbox" defaultChecked />
          Available
        </label>
        <div className="col-span-2">
          <button type="submit" className="rounded-md bg-ink px-4 py-2 font-medium text-paper">
            Create fabric
          </button>
        </div>
      </form>
    </main>
  );
}
