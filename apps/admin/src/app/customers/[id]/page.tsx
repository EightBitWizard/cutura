import Link from "next/link";

import { getCustomerAdminView } from "@cutura/db";

import { environmentDb } from "@/server/catalog";
import { getEnv } from "@/server/env";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const view = await getCustomerAdminView(
    environmentDb("staging"),
    id,
    getEnv().MEASUREMENT_ENCRYPTION_KEY,
  );
  if (!view) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p>Customer not found.</p>
        <Link href="/customers" className="underline">
          Back
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{view.customer.email}</h1>
        <Link href="/customers" className="text-sm text-neutral-600 underline">
          Back
        </Link>
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        {view.customer.locale} - {view.customer.deletionState}
      </p>

      <form
        method="post"
        action={`/api/customers/${id}/notes`}
        className="mt-6 flex flex-col gap-2"
      >
        <label className="text-sm">
          Internal notes
          <textarea
            name="notes"
            rows={2}
            defaultValue={view.customer.notes ?? ""}
            className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="text-sm">
          Tags (comma-separated)
          <input
            name="tags"
            defaultValue={(view.customer.tags ?? []).join(", ")}
            className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm"
          />
        </label>
        <button
          type="submit"
          className="self-start rounded bg-neutral-900 px-3 py-1 text-sm text-white"
        >
          Save notes + tags
        </button>
      </form>

      <h2 className="mt-8 text-lg font-medium">Orders ({view.orders.length})</h2>
      <ul className="mt-2 text-sm">
        {view.orders.map((o) => (
          <li key={o.id}>
            <Link href={`/orders/${o.id}`} className="font-mono underline">
              {o.orderNumber}
            </Link>{" "}
            - {o.status}
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-lg font-medium">Profiles ({view.profiles.length})</h2>
      <ul className="mt-2 text-sm text-neutral-600">
        {view.profiles.map((p) => (
          <li key={p.id}>
            {p.name ?? p.id}: {p.confirmed ? Object.keys(p.confirmed).length : 0} measurements
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-lg font-medium">Fit history ({view.fitReviews.length})</h2>
      <ul className="mt-2 text-sm text-neutral-600">
        {view.fitReviews.map((f) => (
          <li key={f.id}>
            {f.status}
            {f.decision ? ` (${f.decision})` : ""}: {f.reason}
          </li>
        ))}
      </ul>
    </main>
  );
}
