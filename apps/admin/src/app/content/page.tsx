import Link from "next/link";

import { contentPage, incompleteLocales, listRows } from "@cutura/db";

import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { controlDb } from "@/server/catalog";

export const dynamic = "force-dynamic";

const input = "mt-1 w-full rounded border border-line-strong px-2 py-1";

export default async function ContentListPage() {
  const rows = await listRows(controlDb(), contentPage);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Content + legal pages</h1>
        <Link href="/" className="text-sm text-ink-muted underline">
          Dashboard
        </Link>
      </div>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b text-left text-ink-subtle">
            <th className="py-2">Slug</th>
            <th>Kind</th>
            <th>Locales</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const missing = incompleteLocales(p.titleI18n);
            return (
              <tr key={p.id} className="border-b align-top">
                <td className="py-2">
                  <Link href={`/content/${p.id}`} className="underline">
                    {p.slug}
                  </Link>
                </td>
                <td>{p.kind}</td>
                <td className="text-ink-subtle">
                  {missing.length ? `missing ${missing.join(",")}` : "complete"}
                </td>
                <td className="flex gap-2 py-2">
                  <form method="post" action="/api/catalog/publish">
                    <input type="hidden" name="entityType" value="contentPage" />
                    <input type="hidden" name="entityId" value={p.id} />
                    <input type="hidden" name="environment" value="staging" />
                    <input type="hidden" name="back" value="/content" />
                    <button type="submit" className="rounded bg-ink px-2 py-1 text-paper">
                      Publish
                    </button>
                  </form>
                  <form method="post" action={`/api/catalog/content/${p.id}/delete`}>
                    <ConfirmSubmitButton
                      message={`Delete page "${p.slug}" from the control catalog?`}
                      className="rounded border border-line-strong px-2 py-1"
                    >
                      Delete
                    </ConfirmSubmitButton>
                  </form>
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 text-ink-subtle">
                No pages yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <h2 className="mt-10 text-lg font-medium">New page</h2>
      <form
        method="post"
        action="/api/catalog/content"
        className="mt-4 flex max-w-xl flex-col gap-3"
      >
        <label className="text-sm">
          Slug (e.g. about, faq, terms)
          <input name="slug" required className={input} />
        </label>
        <label className="text-sm">
          Kind
          <select name="kind" className={input} defaultValue="content">
            <option value="content">content</option>
            <option value="legal">legal</option>
          </select>
        </label>
        {(["de", "en", "it", "fr"] as const).map((l) => (
          <label key={l} className="text-sm">
            Title ({l.toUpperCase()})
            <input name={`title_${l}`} className={input} />
          </label>
        ))}
        <button
          type="submit"
          className="self-start rounded-md bg-ink px-4 py-2 font-medium text-paper"
        >
          Create page
        </button>
      </form>
    </main>
  );
}
