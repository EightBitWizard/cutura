import Link from "next/link";

import { listRows, supplier } from "@cutura/db";

import { controlDb } from "@/server/catalog";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const rows = await listRows(controlDb(), supplier);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Suppliers</h1>
        <Link href="/" className="text-sm text-neutral-600 underline">
          Dashboard
        </Link>
      </div>
      <p className="mt-2 text-sm text-neutral-500">
        One supplier at launch; all production routes to the default. The model supports more later.
      </p>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left text-neutral-500">
            <th className="py-2">Name</th>
            <th className="py-2">Default</th>
            <th className="py-2">Notes</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-6 text-neutral-500">
                No suppliers yet.
              </td>
            </tr>
          ) : (
            rows.map((s) => (
              <tr key={s.id} className="border-b align-top">
                <td className="py-3">{s.name}</td>
                <td className="py-3">{s.isDefault ? "Yes" : "No"}</td>
                <td className="py-3 text-neutral-500">{s.notes ?? "-"}</td>
                <td className="py-3">
                  <form method="post" action={`/api/catalog/suppliers/${s.id}/delete`}>
                    <button type="submit" className="rounded border border-neutral-300 px-2 py-1">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h2 className="mt-10 text-lg font-medium">New supplier</h2>
      <form
        method="post"
        action="/api/catalog/suppliers"
        className="mt-4 grid max-w-xl grid-cols-2 gap-3"
      >
        <label className="col-span-2 flex flex-col text-sm">
          Name
          <input
            name="name"
            required
            className="mt-1 rounded border border-neutral-300 px-2 py-1"
          />
        </label>
        <label className="col-span-2 flex flex-col text-sm">
          Notes
          <textarea name="notes" className="mt-1 rounded border border-neutral-300 px-2 py-1" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input name="isDefault" type="checkbox" defaultChecked />
          Default supplier
        </label>
        <div className="col-span-2">
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white"
          >
            Create supplier
          </button>
        </div>
      </form>
    </main>
  );
}
