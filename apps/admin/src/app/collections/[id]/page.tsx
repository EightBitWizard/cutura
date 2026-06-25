import Link from "next/link";

import { baseModel, collection, getRow, listCollectionMemberIds, listRows } from "@cutura/db";

import { controlDb } from "@/server/catalog";

export const dynamic = "force-dynamic";

const inputClass = "mt-1 rounded border border-line-strong px-2 py-1";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = controlDb();
  const col = await getRow(db, collection, id);
  if (!col) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p>Collection not found.</p>
        <Link href="/collections" className="underline">
          Back
        </Link>
      </main>
    );
  }
  const memberSet = new Set(await listCollectionMemberIds(db, id));
  const models = await listRows(db, baseModel);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Collection: <span className="font-mono">{col.handle}</span>
        </h1>
        <Link href="/collections" className="text-sm text-ink-muted underline">
          Back
        </Link>
      </div>

      <form
        method="post"
        action={`/api/catalog/collections/${id}`}
        className="mt-6 flex flex-col gap-6"
      >
        <section className="grid grid-cols-2 gap-3">
          <label className="col-span-2 flex flex-col text-sm">
            Handle
            <input name="handle" defaultValue={col.handle} className={inputClass} />
          </label>
          <label className="flex flex-col text-sm">
            Name (DE)
            <input name="name_de" defaultValue={col.nameI18n.de} className={inputClass} />
          </label>
          <label className="flex flex-col text-sm">
            Name (EN)
            <input name="name_en" defaultValue={col.nameI18n.en ?? ""} className={inputClass} />
          </label>
          <label className="flex flex-col text-sm">
            Name (IT)
            <input name="name_it" defaultValue={col.nameI18n.it ?? ""} className={inputClass} />
          </label>
          <label className="flex flex-col text-sm">
            Name (FR)
            <input name="name_fr" defaultValue={col.nameI18n.fr ?? ""} className={inputClass} />
          </label>
        </section>

        <section>
          <h2 className="text-lg font-medium">Members</h2>
          {models.length === 0 ? (
            <p className="text-sm text-ink-subtle">No base models yet.</p>
          ) : (
            <div className="mt-2 flex flex-col gap-1">
              {models.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="member"
                    value={m.id}
                    defaultChecked={memberSet.has(m.id)}
                  />
                  <span className="font-mono">{m.handle}</span> {m.nameI18n.de}
                </label>
              ))}
            </div>
          )}
        </section>

        <div>
          <button type="submit" className="rounded-md bg-ink px-4 py-2 font-medium text-paper">
            Save collection
          </button>
        </div>
      </form>

      <section className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wide text-ink-subtle">Banner</h2>
        <p className="mt-1 text-sm text-ink-subtle">
          {col.bannerMediaId ? `Current: ${col.bannerMediaId}` : "No banner set."}
        </p>
        <form
          method="post"
          action={`/api/catalog/collections/${id}/banner`}
          encType="multipart/form-data"
          className="mt-2 flex items-end gap-3"
        >
          <input type="file" name="file" accept="image/*" required className="text-sm" />
          <button type="submit" className="rounded border border-line-strong px-3 py-1 text-sm">
            Upload banner
          </button>
        </form>
      </section>

      <form method="post" action="/api/catalog/publish" className="mt-6">
        <input type="hidden" name="entityType" value="collection" />
        <input type="hidden" name="entityId" value={id} />
        <input type="hidden" name="environment" value="staging" />
        <input type="hidden" name="back" value={`/collections/${id}`} />
        <button type="submit" className="rounded border border-line-strong px-3 py-1 text-sm">
          Publish to staging
        </button>
      </form>
    </main>
  );
}
