import Link from "next/link";

import { formatCHF } from "@cutura/core";
import { getRow, listMedia, listOptionValues, optionGroup } from "@cutura/db";

import { MediaManager } from "@/components/MediaManager";
import { controlDb } from "@/server/catalog";

export const dynamic = "force-dynamic";

export default async function OptionGroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = controlDb();
  const group = await getRow(db, optionGroup, id);
  if (!group) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p>Option group not found.</p>
        <Link href="/option-groups" className="underline">
          Back
        </Link>
      </main>
    );
  }
  const values = await listOptionValues(db, id);
  const groupMedia = await listMedia(db, "optionGroup", id);
  const valueMedia = new Map<string, Awaited<ReturnType<typeof listMedia>>>();
  for (const v of values) valueMedia.set(v.id, await listMedia(db, "optionValue", v.id));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Option group: <span className="font-mono">{group.code}</span>
        </h1>
        <Link href="/option-groups" className="text-sm text-ink-muted underline">
          Back
        </Link>
      </div>
      <p className="mt-1 text-ink-muted">{group.labelI18n.de}</p>

      <h2 className="mt-8 text-lg font-medium">Values</h2>
      <table className="mt-3 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left text-ink-subtle">
            <th className="py-2">Code</th>
            <th className="py-2">Label (DE)</th>
            <th className="py-2">Surcharge</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {values.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-4 text-ink-subtle">
                No values yet.
              </td>
            </tr>
          ) : (
            values.map((v) => (
              <tr key={v.id} className="border-b">
                <td className="py-2 font-mono">{v.code}</td>
                <td className="py-2">{v.labelI18n.de}</td>
                <td className="py-2">{formatCHF(v.surchargeMinor)}</td>
                <td className="py-2">
                  <form
                    method="post"
                    action={`/api/catalog/option-groups/${id}/values/${v.id}/delete`}
                  >
                    <button type="submit" className="rounded border border-line-strong px-2 py-1">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h2 className="mt-8 text-lg font-medium">Add value</h2>
      <form
        method="post"
        action={`/api/catalog/option-groups/${id}/values`}
        className="mt-3 grid max-w-xl grid-cols-2 gap-3"
      >
        <label className="flex flex-col text-sm">
          Code
          <input
            name="code"
            required
            className="mt-1 rounded border border-line-strong px-2 py-1"
          />
        </label>
        <label className="flex flex-col text-sm">
          Surcharge (Rappen)
          <input
            name="surchargeMinor"
            type="number"
            defaultValue={0}
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
            Add value
          </button>
        </div>
      </form>

      {values.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-medium">Value images (swatches)</h2>
          <p className="mt-1 text-sm text-ink-subtle">
            Thumbnails shown next to each option in the configurator. The None image is used when
            this group is optional - it appears on the no-selection tile. Publish the group to
            apply.
          </p>
          <div className="mt-2 flex flex-col gap-6">
            <MediaManager
              entityType="optionGroup"
              entityId={id}
              backPath={`/option-groups/${id}`}
              media={groupMedia}
              heading="None (shown when nothing is selected, optional groups only)"
            />
            {values.map((v) => (
              <MediaManager
                key={v.id}
                entityType="optionValue"
                entityId={v.id}
                backPath={`/option-groups/${id}`}
                media={valueMedia.get(v.id) ?? []}
                heading={`Value: ${v.code}`}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
