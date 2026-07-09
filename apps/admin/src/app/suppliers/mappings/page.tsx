import Link from "next/link";

import { listProducerMappings } from "@cutura/db";

import { FeedbackBanner } from "@/components/FeedbackBanner";
import { environmentDb } from "@/server/catalog";

export const dynamic = "force-dynamic";

const input = "mt-1 rounded border border-line-strong px-2 py-1";

// Producer catalog mapping editor: CUTURA codes -> the producer's external codes.
// Keys are catalog CODES (model handle, fabric code, "group:value", upgrade code),
// so the mapping matches what the frozen order snapshots store.
export default async function ProducerMappingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const feedbackParams = await searchParams;
  const rawProducer = feedbackParams.producer;
  const producer = (Array.isArray(rawProducer) ? rawProducer[0] : rawProducer) || "kutetailor";
  const rows = await listProducerMappings(environmentDb("staging"), producer);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Producer mappings</h1>
        <Link href="/suppliers" className="text-sm text-ink-muted underline">
          Suppliers
        </Link>
      </div>
      <p className="mt-2 text-sm text-ink-subtle">
        Producer <span className="font-mono">{producer}</span>: map CUTURA catalog codes to external
        producer codes. Unmapped entries still render on the order sheet with a warning.
      </p>

      <FeedbackBanner params={feedbackParams} />

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-subtle">
            <th className="py-2">Type</th>
            <th>CUTURA key</th>
            <th>Producer code</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-line">
              <td className="py-2">{r.entityType}</td>
              <td className="font-mono">{r.entityKey}</td>
              <td className="font-mono">{r.externalCode}</td>
              <td className="text-right">
                <form method="post" action="/api/producers/mapping">
                  <input type="hidden" name="_action" value="delete" />
                  <input type="hidden" name="producer" value={producer} />
                  <input type="hidden" name="id" value={r.id} />
                  <button type="submit" className="text-xs text-ink-subtle underline">
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 text-ink-subtle">
                No mappings yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <h2 className="mt-10 text-lg font-medium">Add or update a mapping</h2>
      <form
        method="post"
        action="/api/producers/mapping"
        className="mt-4 grid max-w-xl grid-cols-2 gap-3"
      >
        <input type="hidden" name="producer" value={producer} />
        <label className="flex flex-col text-sm">
          Type
          <select name="entityType" className={input}>
            <option value="model">model (handle)</option>
            <option value="fabric">fabric (code)</option>
            <option value="option_value">option (group:value)</option>
            <option value="upgrade">upgrade (code)</option>
          </select>
        </label>
        <label className="flex flex-col text-sm">
          CUTURA key
          <input
            name="entityKey"
            required
            placeholder="e.g. oxford-business-shirt"
            className={input}
          />
        </label>
        <label className="col-span-2 flex flex-col text-sm">
          Producer code
          <input name="externalCode" required placeholder="e.g. KT-STYLE-0421" className={input} />
        </label>
        <div className="col-span-2">
          <button type="submit" className="rounded-md bg-ink px-4 py-2 font-medium text-paper">
            Save mapping
          </button>
        </div>
      </form>
    </main>
  );
}
