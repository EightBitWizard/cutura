import Link from "next/link";

import { formatCHF } from "@cutura/core";
import { baseModel, garmentType, incompleteLocales, listRows } from "@cutura/db";

import { controlDb } from "@/server/catalog";

export const dynamic = "force-dynamic";

export default async function BaseModelsPage() {
  const db = controlDb();
  const models = await listRows(db, baseModel);
  const garmentTypes = await listRows(db, garmentType);
  const gtKey = new Map(garmentTypes.map((g) => [g.id, g.key]));

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Base models</h1>
        <Link href="/" className="text-sm text-neutral-600 underline">
          Dashboard
        </Link>
      </div>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left text-neutral-500">
            <th className="py-2">Handle</th>
            <th className="py-2">Name (DE)</th>
            <th className="py-2">Type</th>
            <th className="py-2">Price</th>
            <th className="py-2">Status</th>
            <th className="py-2">Locales</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {models.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-6 text-neutral-500">
                No base models yet.
              </td>
            </tr>
          ) : (
            models.map((m) => {
              const missing = incompleteLocales(m.nameI18n);
              return (
                <tr key={m.id} className="border-b align-top">
                  <td className="py-3 font-mono">{m.handle}</td>
                  <td className="py-3">{m.nameI18n.de}</td>
                  <td className="py-3">{gtKey.get(m.garmentTypeId) ?? m.garmentTypeId}</td>
                  <td className="py-3">{formatCHF(m.basePriceMinor)}</td>
                  <td className="py-3">{m.status}</td>
                  <td className="py-3 text-neutral-500">
                    {missing.length === 0 ? "complete" : `missing: ${missing.join(", ")}`}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/base-models/${m.id}`}
                        className="rounded border border-neutral-300 px-2 py-1"
                      >
                        Edit
                      </Link>
                      <form method="post" action="/api/catalog/publish">
                        <input type="hidden" name="entityType" value="baseModel" />
                        <input type="hidden" name="entityId" value={m.id} />
                        <input type="hidden" name="environment" value="staging" />
                        <input type="hidden" name="back" value="/base-models" />
                        <button
                          type="submit"
                          className="rounded bg-neutral-900 px-2 py-1 text-white"
                        >
                          Publish to staging
                        </button>
                      </form>
                      <form method="post" action={`/api/catalog/base-models/${m.id}/delete`}>
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

      <h2 className="mt-10 text-lg font-medium">New base model</h2>
      {garmentTypes.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-500">Create a garment type first.</p>
      ) : (
        <form
          method="post"
          action="/api/catalog/base-models"
          className="mt-4 grid max-w-2xl grid-cols-2 gap-3"
        >
          <label className="flex flex-col text-sm">
            Garment type
            <select
              name="garmentTypeId"
              required
              className="mt-1 rounded border border-neutral-300 px-2 py-1"
            >
              {garmentTypes.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.key}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm">
            Handle (e.g. oxford-business)
            <input
              name="handle"
              required
              className="mt-1 rounded border border-neutral-300 px-2 py-1"
            />
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
            Base price (Rappen)
            <input
              name="basePriceMinor"
              type="number"
              defaultValue={12900}
              className="mt-1 rounded border border-neutral-300 px-2 py-1"
            />
          </label>
          <label className="flex flex-col text-sm">
            Status
            <select name="status" className="mt-1 rounded border border-neutral-300 px-2 py-1">
              <option value="draft">draft</option>
              <option value="orderable">orderable</option>
              <option value="view_only">view_only</option>
            </select>
          </label>
          <label className="flex flex-col text-sm">
            Lead time min (days)
            <input
              name="leadTimeMinDays"
              type="number"
              defaultValue={21}
              className="mt-1 rounded border border-neutral-300 px-2 py-1"
            />
          </label>
          <label className="flex flex-col text-sm">
            Lead time max (days)
            <input
              name="leadTimeMaxDays"
              type="number"
              defaultValue={35}
              className="mt-1 rounded border border-neutral-300 px-2 py-1"
            />
          </label>
          <div className="col-span-2">
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white"
            >
              Create base model
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
