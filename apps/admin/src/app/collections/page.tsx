import Link from "next/link";

import { collection, collectionMember, incompleteLocales, listRows } from "@cutura/db";

import { controlDb } from "@/server/catalog";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const db = controlDb();
  const collections = await listRows(db, collection);
  const members = await listRows(db, collectionMember);
  const count = new Map<string, number>();
  for (const m of members) count.set(m.collectionId, (count.get(m.collectionId) ?? 0) + 1);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Collections</h1>
        <Link href="/" className="text-sm text-ink-muted underline">
          Dashboard
        </Link>
      </div>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left text-ink-subtle">
            <th className="py-2">Handle</th>
            <th className="py-2">Name (DE)</th>
            <th className="py-2">Members</th>
            <th className="py-2">Locales</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {collections.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-6 text-ink-subtle">
                No collections yet.
              </td>
            </tr>
          ) : (
            collections.map((c) => {
              const missing = incompleteLocales(c.nameI18n);
              return (
                <tr key={c.id} className="border-b align-top">
                  <td className="py-3 font-mono">{c.handle}</td>
                  <td className="py-3">{c.nameI18n.de}</td>
                  <td className="py-3">
                    <Link href={`/collections/${c.id}`} className="underline">
                      {count.get(c.id) ?? 0} members
                    </Link>
                  </td>
                  <td className="py-3 text-ink-subtle">
                    {missing.length === 0 ? "complete" : `missing: ${missing.join(", ")}`}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <form method="post" action="/api/catalog/publish">
                        <input type="hidden" name="entityType" value="collection" />
                        <input type="hidden" name="entityId" value={c.id} />
                        <input type="hidden" name="environment" value="staging" />
                        <input type="hidden" name="back" value="/collections" />
                        <button type="submit" className="rounded bg-ink px-2 py-1 text-paper">
                          Publish to staging
                        </button>
                      </form>
                      <form method="post" action={`/api/catalog/collections/${c.id}/delete`}>
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

      <h2 className="mt-10 text-lg font-medium">New collection</h2>
      <form
        method="post"
        action="/api/catalog/collections"
        className="mt-4 grid max-w-xl grid-cols-2 gap-3"
      >
        <label className="col-span-2 flex flex-col text-sm">
          Handle (e.g. featured)
          <input
            name="handle"
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
        <div className="col-span-2">
          <button type="submit" className="rounded-md bg-ink px-4 py-2 font-medium text-paper">
            Create collection
          </button>
        </div>
      </form>
    </main>
  );
}
