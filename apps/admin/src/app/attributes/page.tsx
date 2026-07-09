import Link from "next/link";

import { attributeDefinition, incompleteLocales, listRows } from "@cutura/db";

import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { controlDb } from "@/server/catalog";

export const dynamic = "force-dynamic";

export default async function AttributesPage() {
  const rows = await listRows(controlDb(), attributeDefinition);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Attributes</h1>
        <Link href="/" className="text-sm text-ink-muted underline">
          Dashboard
        </Link>
      </div>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left text-ink-subtle">
            <th className="py-2">Key</th>
            <th className="py-2">Label (DE)</th>
            <th className="py-2">Applies to</th>
            <th className="py-2">Locales</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-6 text-ink-subtle">
                No attributes yet.
              </td>
            </tr>
          ) : (
            rows.map((a) => {
              const missing = incompleteLocales(a.labelI18n);
              return (
                <tr key={a.id} className="border-b align-top">
                  <td className="py-3 font-mono">{a.key}</td>
                  <td className="py-3">{a.labelI18n.de}</td>
                  <td className="py-3">{a.appliesTo}</td>
                  <td className="py-3 text-ink-subtle">
                    {missing.length === 0 ? "complete" : `missing: ${missing.join(", ")}`}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <form method="post" action="/api/catalog/publish">
                        <input type="hidden" name="entityType" value="attributeDefinition" />
                        <input type="hidden" name="entityId" value={a.id} />
                        <input type="hidden" name="environment" value="staging" />
                        <input type="hidden" name="back" value="/attributes" />
                        <button type="submit" className="rounded bg-ink px-2 py-1 text-paper">
                          Publish to staging
                        </button>
                      </form>
                      <form method="post" action={`/api/catalog/attributes/${a.id}/delete`}>
                        <ConfirmSubmitButton
                          message={`Delete attribute "${a.key}" from the control catalog?`}
                          className="rounded border border-line-strong px-2 py-1"
                        >
                          Delete
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <h2 className="mt-10 text-lg font-medium">New attribute</h2>
      <form
        method="post"
        action="/api/catalog/attributes"
        className="mt-4 grid max-w-xl grid-cols-2 gap-3"
      >
        <label className="flex flex-col text-sm">
          Key (e.g. colour_family)
          <input name="key" required className="mt-1 rounded border border-line-strong px-2 py-1" />
        </label>
        <label className="flex flex-col text-sm">
          Applies to
          <select name="appliesTo" className="mt-1 rounded border border-line-strong px-2 py-1">
            <option value="model">model</option>
            <option value="fabric">fabric</option>
          </select>
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
            Create attribute
          </button>
        </div>
      </form>
    </main>
  );
}
