import Link from "next/link";

import { baseModel, listCrossSellRules, listRows } from "@cutura/db";

import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { controlDb } from "@/server/catalog";

export const dynamic = "force-dynamic";

const input = "mt-1 rounded border border-line-strong px-2 py-1";

export default async function CrossSellPage() {
  const db = controlDb();
  const [rules, models] = await Promise.all([listCrossSellRules(db), listRows(db, baseModel)]);
  const nameById = new Map(models.map((m) => [m.id, m.nameI18n.de]));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Cross-sell rules</h1>
        <Link href="/" className="text-sm text-ink-muted underline">
          Dashboard
        </Link>
      </div>
      <p className="mt-1 text-sm text-ink-subtle">
        Curated suggestions: a source (model handle, or attribute key:value) suggests a model.
      </p>

      <ul className="mt-6 flex flex-col gap-2 text-sm">
        {rules.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between rounded border border-line p-3"
          >
            <span>
              {r.sourceType} <span className="font-mono">{r.sourceKey}</span> {"->"}{" "}
              {nameById.get(r.suggestedModelId) ?? r.suggestedModelId} (pos {r.position})
            </span>
            <div className="flex gap-2">
              <form method="post" action="/api/catalog/publish">
                <input type="hidden" name="entityType" value="crossSellRule" />
                <input type="hidden" name="entityId" value={r.id} />
                <input type="hidden" name="environment" value="staging" />
                <input type="hidden" name="back" value="/cross-sell" />
                <button type="submit" className="rounded bg-ink px-2 py-1 text-paper">
                  Publish
                </button>
              </form>
              <form method="post" action={`/api/catalog/cross-sell/${r.id}/delete`}>
                <ConfirmSubmitButton
                  message={`Delete the cross-sell rule for "${r.sourceKey}"?`}
                  className="rounded border border-line-strong px-2 py-1"
                >
                  Delete
                </ConfirmSubmitButton>
              </form>
            </div>
          </li>
        ))}
        {rules.length === 0 && <li className="text-ink-subtle">No rules yet.</li>}
      </ul>

      <h2 className="mt-10 text-lg font-medium">New rule</h2>
      <form
        method="post"
        action="/api/catalog/cross-sell"
        className="mt-3 flex flex-wrap items-end gap-3"
      >
        <label className="flex flex-col text-sm">
          Source type
          <select name="sourceType" className={input} defaultValue="model">
            <option value="model">model</option>
            <option value="attribute">attribute</option>
          </select>
        </label>
        <label className="flex flex-col text-sm">
          Source key (handle or key:value)
          <input name="sourceKey" required className={input} />
        </label>
        <label className="flex flex-col text-sm">
          Suggested model
          <select name="suggestedModelId" required className={input}>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nameI18n.de} ({m.handle})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-sm">
          Position
          <input name="position" type="number" min={0} defaultValue={0} className={input} />
        </label>
        <button
          type="submit"
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper"
        >
          Create rule
        </button>
      </form>
    </main>
  );
}
