import Link from "next/link";

import { listRedirects } from "@cutura/db";

import { environmentDb } from "@/server/catalog";

export const dynamic = "force-dynamic";

const input = "mt-1 rounded border border-line-strong px-2 py-1";

export default async function RedirectsPage() {
  const rows = await listRedirects(environmentDb("staging"));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Redirects</h1>
        <Link href="/" className="text-sm text-ink-muted underline">
          Dashboard
        </Link>
      </div>
      <p className="mt-1 text-sm text-ink-subtle">
        Exact-path redirects checked in the storefront middleware (e.g. /de/old to /de/new).
      </p>

      <ul className="mt-6 flex flex-col gap-2 text-sm">
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between rounded border border-line p-3"
          >
            <span className="font-mono">
              {r.fromPath} {"->"} {r.toPath} ({r.code})
            </span>
            <form method="post" action={`/api/redirects/${r.id}/delete`}>
              <button type="submit" className="rounded border border-line-strong px-2 py-1">
                Delete
              </button>
            </form>
          </li>
        ))}
        {rows.length === 0 && <li className="text-ink-subtle">No redirects yet.</li>}
      </ul>

      <h2 className="mt-10 text-lg font-medium">New redirect</h2>
      <form method="post" action="/api/redirects" className="mt-3 flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-sm">
          From path
          <input name="fromPath" required placeholder="/de/old" className={input} />
        </label>
        <label className="flex flex-col text-sm">
          To path
          <input name="toPath" required placeholder="/de/new" className={input} />
        </label>
        <label className="flex flex-col text-sm">
          Code
          <select name="code" className={input} defaultValue="301">
            <option value="301">301</option>
            <option value="302">302</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper"
        >
          Create
        </button>
      </form>
    </main>
  );
}
