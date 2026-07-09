import Link from "next/link";

import {
  attributeDefinition,
  baseModel,
  fabric,
  getModelAllowLists,
  getRow,
  listEntityAttributeValues,
  listMedia,
  listRows,
  optionGroup,
  upgrade,
} from "@cutura/db";

import { FeedbackBanner } from "@/components/FeedbackBanner";
import { MediaManager } from "@/components/MediaManager";
import { PublishPanel } from "@/components/PublishPanel";
import { controlDb } from "@/server/catalog";

export const dynamic = "force-dynamic";

const inputClass = "mt-1 rounded border border-line-strong px-2 py-1";

export default async function BaseModelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const feedbackParams = await searchParams;
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
  const attrDefs = (await listRows(db, attributeDefinition)).filter((d) => d.appliesTo === "model");
  const attrValues = await listEntityAttributeValues(db, "model", id);
  const attrByDef = new Map(attrValues.map((a) => [a.attributeDefinitionId, a.value]));

  const fabricSet = new Set(allow.fabricIds);
  const upgradeSet = new Set(allow.upgradeIds);
  const optionRequired = new Map(allow.options.map((o) => [o.optionGroupId, o.required]));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Base model: <span className="font-mono">{model.handle}</span>
        </h1>
        <Link href="/base-models" className="text-sm text-ink-muted underline">
          Back
        </Link>
      </div>

      <FeedbackBanner params={feedbackParams} />

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

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">Description (shown on the product page)</h2>
          <p className="text-sm text-ink-subtle">
            Free text per language. Line breaks are kept. German is the fallback.
          </p>
          {(["de", "en", "it", "fr"] as const).map((loc) => (
            <label key={loc} className="flex flex-col text-sm">
              {`Text (${loc.toUpperCase()})`}
              <textarea
                name={`description_${loc}`}
                defaultValue={model.descriptionI18n?.[loc] ?? ""}
                rows={3}
                className={inputClass}
              />
            </label>
          ))}
        </section>

        <section>
          <h2 className="text-lg font-medium">Allowed fabrics</h2>
          {fabrics.length === 0 ? (
            <p className="text-sm text-ink-subtle">No fabrics yet.</p>
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
            <p className="text-sm text-ink-subtle">No option groups yet.</p>
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
                  <label className="flex items-center gap-1 text-ink-subtle">
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
            <p className="text-sm text-ink-subtle">No upgrades yet.</p>
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
          <button type="submit" className="rounded-md bg-ink px-4 py-2 font-medium text-paper">
            Save model
          </button>
        </div>
      </form>

      <MediaManager
        entityType="model"
        entityId={id}
        backPath={`/base-models/${id}`}
        media={mediaRows}
      />

      <section className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wide text-ink-subtle">
          Attributes (discovery filters)
        </h2>
        {attrDefs.length === 0 && (
          <p className="mt-2 text-sm text-ink-subtle">
            No model attributes defined yet. Create them under Attributes.
          </p>
        )}
        <div className="mt-2 flex flex-col gap-2">
          {attrDefs.map((d) => (
            <form
              key={d.id}
              method="post"
              action="/api/catalog/attribute-values"
              className="flex items-end gap-2 text-sm"
            >
              <input type="hidden" name="entityType" value="model" />
              <input type="hidden" name="entityId" value={id} />
              <input type="hidden" name="attributeDefinitionId" value={d.id} />
              <input type="hidden" name="back" value={`/base-models/${id}`} />
              <label className="flex flex-col">
                {d.key}
                <input
                  name="value"
                  defaultValue={attrByDef.get(d.id) ?? ""}
                  placeholder="(blank to clear)"
                  className={inputClass}
                />
              </label>
              <button type="submit" className="rounded border border-line-strong px-2 py-1">
                Save
              </button>
            </form>
          ))}
        </div>
      </section>

      <PublishPanel entityType="baseModel" entityId={id} backPath={`/base-models/${id}`} />
    </main>
  );
}
