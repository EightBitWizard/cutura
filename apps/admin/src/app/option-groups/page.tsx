import Link from "next/link";

import { garmentType, incompleteLocales, listRows, optionGroup, optionValue } from "@cutura/db";

import { controlDb } from "@/server/catalog";

export const dynamic = "force-dynamic";

export default async function OptionGroupsPage() {
  const db = controlDb();
  const groups = await listRows(db, optionGroup);
  const garmentTypes = await listRows(db, garmentType);
  const values = await listRows(db, optionValue);

  const gtKeyById = new Map(garmentTypes.map((g) => [g.id, g.key]));
  const valueCount = new Map<string, number>();
  for (const v of values)
    valueCount.set(v.optionGroupId, (valueCount.get(v.optionGroupId) ?? 0) + 1);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Option groups</h1>
        <Link href="/" className="text-sm text-ink-muted underline">
          Dashboard
        </Link>
      </div>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left text-ink-subtle">
            <th className="py-2">Code</th>
            <th className="py-2">Label (DE)</th>
            <th className="py-2">Garment type</th>
            <th className="py-2">Values</th>
            <th className="py-2">Locales</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {groups.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-6 text-ink-subtle">
                No option groups yet.
              </td>
            </tr>
          ) : (
            groups.map((g) => {
              const missing = incompleteLocales(g.labelI18n);
              return (
                <tr key={g.id} className="border-b align-top">
                  <td className="py-3 font-mono">{g.code}</td>
                  <td className="py-3">{g.labelI18n.de}</td>
                  <td className="py-3">{gtKeyById.get(g.garmentTypeId) ?? g.garmentTypeId}</td>
                  <td className="py-3">
                    <Link href={`/option-groups/${g.id}`} className="underline">
                      {valueCount.get(g.id) ?? 0} values
                    </Link>
                  </td>
                  <td className="py-3 text-ink-subtle">
                    {missing.length === 0 ? "complete" : `missing: ${missing.join(", ")}`}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/option-groups/${g.id}`}
                        className="rounded border border-line-strong px-2 py-1"
                      >
                        Images
                      </Link>
                      <form method="post" action="/api/catalog/publish">
                        <input type="hidden" name="entityType" value="optionGroup" />
                        <input type="hidden" name="entityId" value={g.id} />
                        <input type="hidden" name="environment" value="staging" />
                        <input type="hidden" name="back" value="/option-groups" />
                        <button type="submit" className="rounded bg-ink px-2 py-1 text-paper">
                          Publish to staging
                        </button>
                      </form>
                      <form method="post" action={`/api/catalog/option-groups/${g.id}/delete`}>
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

      <h2 className="mt-10 text-lg font-medium">New option group</h2>
      {garmentTypes.length === 0 ? (
        <p className="mt-2 text-sm text-ink-subtle">Create a garment type first.</p>
      ) : (
        <form
          method="post"
          action="/api/catalog/option-groups"
          className="mt-4 grid max-w-xl grid-cols-2 gap-3"
        >
          <label className="flex flex-col text-sm">
            Garment type
            <select
              name="garmentTypeId"
              required
              className="mt-1 rounded border border-line-strong px-2 py-1"
            >
              {garmentTypes.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.key}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm">
            Code (e.g. collar)
            <input
              name="code"
              required
              className="mt-1 rounded border border-line-strong px-2 py-1"
            />
          </label>
          <label className="flex flex-col text-sm">
            Label (DE)
            <input
              name="label_de"
              required
              className="mt-1 rounded border border-line-strong px-2 py-1"
            />
          </label>
          <label className="flex flex-col text-sm">
            Label (EN)
            <input name="label_en" className="mt-1 rounded border border-line-strong px-2 py-1" />
          </label>
          <label className="flex flex-col text-sm">
            Label (IT)
            <input name="label_it" className="mt-1 rounded border border-line-strong px-2 py-1" />
          </label>
          <label className="flex flex-col text-sm">
            Label (FR)
            <input name="label_fr" className="mt-1 rounded border border-line-strong px-2 py-1" />
          </label>
          <div className="col-span-2">
            <button type="submit" className="rounded-md bg-ink px-4 py-2 font-medium text-paper">
              Create option group
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
