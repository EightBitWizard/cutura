import Link from "next/link";

import {
  baseModel,
  fabric,
  getModelAllowLists,
  getRow,
  listMedia,
  listRows,
  optionGroup,
  upgrade,
} from "@cutura/db";

import { controlDb } from "@/server/catalog";

export const dynamic = "force-dynamic";

const inputClass = "mt-1 rounded border border-neutral-300 px-2 py-1";

export default async function BaseModelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = controlDb();
  const model = await getRow(db, baseModel, id);
  if (!model) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p>Base model not found.</p>
        <Link href="/base-models" className="underline">
          Back
        </Link>
      </main>
    );
  }

  const allow = await getModelAllowLists(db, id);
  const fabrics = await listRows(db, fabric);
  const optionGroups = await listRows(db, optionGroup);
  const upgrades = await listRows(db, upgrade);
  const mediaRows = await listMedia(db, "model", id);

  const fabricSet = new Set(allow.fabricIds);
  const upgradeSet = new Set(allow.upgradeIds);
  const optionRequired = new Map(allow.options.map((o) => [o.optionGroupId, o.required]));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Base model: <span className="font-mono">{model.handle}</span>
        </h1>
        <Link href="/base-models" className="text-sm text-neutral-600 underline">
          Back
        </Link>
      </div>

      <form
        method="post"
        action={`/api/catalog/base-models/${id}`}
        className="mt-6 flex flex-col gap-6"
      >
        <section className="grid grid-cols-2 gap-3">
          <label className="flex flex-col text-sm">
            Handle
            <input name="handle" defaultValue={model.handle} className={inputClass} />
          </label>
          <label className="flex flex-col text-sm">
            Status
            <select name="status" defaultValue={model.status} className={inputClass}>
              <option value="draft">draft</option>
              <option value="orderable">orderable</option>
              <option value="view_only">view_only</option>
            </select>
          </label>
          <label className="flex flex-col text-sm">
            Name (DE)
            <input name="name_de" defaultValue={model.nameI18n.de} className={inputClass} />
          </label>
          <label className="flex flex-col text-sm">
            Name (EN)
            <input name="name_en" defaultValue={model.nameI18n.en ?? ""} className={inputClass} />
          </label>
          <label className="flex flex-col text-sm">
            Name (IT)
            <input name="name_it" defaultValue={model.nameI18n.it ?? ""} className={inputClass} />
          </label>
          <label className="flex flex-col text-sm">
            Name (FR)
            <input name="name_fr" defaultValue={model.nameI18n.fr ?? ""} className={inputClass} />
          </label>
          <label className="flex flex-col text-sm">
            Base price (Rappen)
            <input
              name="basePriceMinor"
              type="number"
              defaultValue={model.basePriceMinor}
              className={inputClass}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col text-sm">
              Lead min
              <input
                name="leadTimeMinDays"
                type="number"
                defaultValue={model.leadTimeMinDays}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col text-sm">
              Lead max
              <input
                name="leadTimeMaxDays"
                type="number"
                defaultValue={model.leadTimeMaxDays}
                className={inputClass}
              />
            </label>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-medium">Allowed fabrics</h2>
          {fabrics.length === 0 ? (
            <p className="text-sm text-neutral-500">No fabrics yet.</p>
          ) : (
            <div className="mt-2 flex flex-col gap-1">
              {fabrics.map((f) => (
                <label key={f.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="fabric"
                    value={f.id}
                    defaultChecked={fabricSet.has(f.id)}
                  />
                  <span className="font-mono">{f.code}</span> {f.nameI18n.de}
                </label>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-medium">Allowed option groups</h2>
          {optionGroups.length === 0 ? (
            <p className="text-sm text-neutral-500">No option groups yet.</p>
          ) : (
            <div className="mt-2 flex flex-col gap-1">
              {optionGroups.map((g) => (
                <div key={g.id} className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="option"
                      value={g.id}
                      defaultChecked={optionRequired.has(g.id)}
                    />
                    <span className="font-mono">{g.code}</span> {g.labelI18n.de}
                  </label>
                  <label className="flex items-center gap-1 text-neutral-500">
                    <input
                      type="checkbox"
                      name={`required_${g.id}`}
                      defaultChecked={optionRequired.get(g.id) ?? false}
                    />
                    required
                  </label>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-medium">Allowed upgrades</h2>
          {upgrades.length === 0 ? (
            <p className="text-sm text-neutral-500">No upgrades yet.</p>
          ) : (
            <div className="mt-2 flex flex-col gap-1">
              {upgrades.map((u) => (
                <label key={u.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="upgrade"
                    value={u.id}
                    defaultChecked={upgradeSet.has(u.id)}
                  />
                  <span className="font-mono">{u.code}</span> {u.nameI18n.de}
                </label>
              ))}
            </div>
          )}
        </section>

        <div>
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white"
          >
            Save model
          </button>
        </div>
      </form>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Images</h2>
        {mediaRows.length === 0 ? (
          <p className="text-sm text-neutral-500">No images yet.</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-4">
            {mediaRows.map((m) => (
              <div key={m.id} className="w-40 text-xs">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of an R2 object; public serving is a go-live task */}
                <img
                  src={`/api/media/${m.id}`}
                  alt={m.alt ?? ""}
                  className="h-32 w-40 rounded border border-neutral-200 object-cover"
                />
                <div className="mt-1 text-neutral-500">{m.isPrimary ? "primary" : ""}</div>
                <div className="mt-1 flex gap-1">
                  {!m.isPrimary && (
                    <form method="post" action={`/api/catalog/media/${m.id}/primary`}>
                      <input type="hidden" name="entityType" value="model" />
                      <input type="hidden" name="entityId" value={id} />
                      <input type="hidden" name="back" value={`/base-models/${id}`} />
                      <button type="submit" className="rounded border border-neutral-300 px-1">
                        Make primary
                      </button>
                    </form>
                  )}
                  <form method="post" action={`/api/catalog/media/${m.id}/delete`}>
                    <input type="hidden" name="back" value={`/base-models/${id}`} />
                    <button type="submit" className="rounded border border-neutral-300 px-1">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
        <form
          method="post"
          action="/api/catalog/media"
          encType="multipart/form-data"
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <input type="hidden" name="entityType" value="model" />
          <input type="hidden" name="entityId" value={id} />
          <input type="hidden" name="back" value={`/base-models/${id}`} />
          <label className="flex flex-col text-sm">
            Image
            <input type="file" name="file" accept="image/*" required className="mt-1 text-sm" />
          </label>
          <label className="flex flex-col text-sm">
            Alt text
            <input name="alt" className="mt-1 rounded border border-neutral-300 px-2 py-1" />
          </label>
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
          >
            Upload
          </button>
        </form>
      </section>

      <form method="post" action="/api/catalog/publish" className="mt-6">
        <input type="hidden" name="entityType" value="baseModel" />
        <input type="hidden" name="entityId" value={id} />
        <input type="hidden" name="environment" value="staging" />
        <input type="hidden" name="back" value={`/base-models/${id}`} />
        <button type="submit" className="rounded border border-neutral-300 px-3 py-1 text-sm">
          Publish to staging
        </button>
      </form>
    </main>
  );
}
