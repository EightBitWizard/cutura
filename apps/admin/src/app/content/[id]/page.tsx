import Link from "next/link";

import { type LocalizedText, contentPage, getRow } from "@cutura/db";

import { controlDb } from "@/server/catalog";

export const dynamic = "force-dynamic";

const input = "mt-1 w-full rounded border border-neutral-300 px-2 py-1";

export default async function ContentEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  const page = await getRow(controlDb(), contentPage, id);
  if (!page) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <p>Page not found.</p>
        <Link href="/content" className="underline">
          Back
        </Link>
      </main>
    );
  }
  const title = page.titleI18n as LocalizedText;
  const body = (page.bodyI18n ?? {}) as LocalizedText;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{page.slug}</h1>
        <Link href="/content" className="text-sm text-neutral-600 underline">
          Back
        </Link>
      </div>
      {saved && <p className="mt-2 text-sm text-green-700">Saved (version {page.version}).</p>}

      <form
        method="post"
        action={`/api/catalog/content/${id}`}
        className="mt-6 flex flex-col gap-4"
      >
        <label className="text-sm">
          Kind
          <select name="kind" className={input} defaultValue={page.kind}>
            <option value="content">content</option>
            <option value="legal">legal</option>
          </select>
        </label>
        {(["de", "en", "it", "fr"] as const).map((l) => (
          <div key={l} className="rounded border border-neutral-200 p-3">
            <p className="text-sm font-medium">{l.toUpperCase()}</p>
            <label className="mt-2 block text-sm">
              Title
              <input name={`title_${l}`} defaultValue={title[l] ?? ""} className={input} />
            </label>
            <label className="mt-2 block text-sm">
              Body
              <textarea
                name={`body_${l}`}
                rows={5}
                defaultValue={body[l] ?? ""}
                className={input}
              />
            </label>
          </div>
        ))}
        <button
          type="submit"
          className="self-start rounded-md bg-neutral-900 px-4 py-2 font-medium text-white"
        >
          Save (new version)
        </button>
      </form>
    </main>
  );
}
