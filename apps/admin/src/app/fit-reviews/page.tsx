import Link from "next/link";

import { listFitReviews } from "@cutura/db";

import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { environmentDb } from "@/server/catalog";

export const dynamic = "force-dynamic";

export default async function FitReviewsPage() {
  const reviews = await listFitReviews(environmentDb("staging"));
  const open = reviews.filter((r) => r.status === "open");

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Fit reviews</h1>
        <Link href="/" className="text-sm text-ink-muted underline">
          Dashboard
        </Link>
      </div>
      <p className="mt-1 text-sm text-ink-subtle">
        {open.length} open of {reviews.length}
      </p>

      <ul className="mt-6 flex flex-col gap-4">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-lg border border-line p-4 text-sm">
            <div className="flex items-center justify-between">
              <Link href={`/orders/${r.orderId}`} className="font-mono underline">
                {r.orderNumber}
              </Link>
              <span className="text-ink-subtle">
                {r.status}
                {r.decision ? ` (${r.decision})` : ""}
              </span>
            </div>
            <p className="mt-2 text-ink">{r.reason}</p>
            <p className="mt-1 text-ink-subtle">{r.photoCount} photo(s)</p>

            {r.status === "open" && (
              <form
                method="post"
                action={`/api/fit-reviews/${r.id}/decide`}
                className="mt-3 flex items-center gap-2"
              >
                <select name="decision" className="rounded border border-line-strong px-2 py-1">
                  <option value="remake">remake</option>
                  <option value="refund">refund</option>
                  <option value="alteration">alteration</option>
                </select>
                <ConfirmSubmitButton
                  message="Record this decision? It closes the fit review and cannot be undone."
                  className="rounded bg-ink px-3 py-1 text-sm text-paper"
                >
                  Decide
                </ConfirmSubmitButton>
              </form>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
