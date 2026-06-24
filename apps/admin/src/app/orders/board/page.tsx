import Link from "next/link";

import { ORDER_STATUSES, type OrderStatus } from "@cutura/core";
import { type BoardOrder, getPipelineBoard } from "@cutura/db";

import { environmentDb } from "@/server/catalog";
import { getEnv } from "@/server/env";

export const dynamic = "force-dynamic";

const LANE_LABELS: Record<OrderStatus, string> = {
  new: "New",
  in_review: "In review",
  approved: "Approved",
  in_production: "In production",
  arrived_ch: "Arrived CH",
  qc_passed: "QC passed",
  qc_failed: "QC failed",
  awaiting_customer_info: "Awaiting info",
  shipped: "Shipped",
  problem: "Problem",
};

export default async function BoardPage() {
  const board = await getPipelineBoard(
    environmentDb("staging"),
    getEnv().MEASUREMENT_ENCRYPTION_KEY,
  );
  const byStatus: Record<OrderStatus, BoardOrder[]> = Object.fromEntries(
    ORDER_STATUSES.map((s) => [s, [] as BoardOrder[]]),
  ) as Record<OrderStatus, BoardOrder[]>;
  for (const o of board) byStatus[o.status].push(o);
  const outlierCount = board.filter((o) => o.outlier).length;

  return (
    <main className="px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Pipeline board</h1>
        <Link href="/orders" className="text-sm text-neutral-600 underline">
          List view
        </Link>
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        {board.length} orders (staging)
        {outlierCount > 0 && (
          <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-amber-800">
            {outlierCount} need review
          </span>
        )}
      </p>

      <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
        {ORDER_STATUSES.map((s) => (
          <section key={s} className="min-w-56 shrink-0">
            <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500">
              {LANE_LABELS[s]} ({byStatus[s].length})
            </h2>
            <div className="mt-2 flex flex-col gap-2">
              {byStatus[s].map((o) => (
                <Link
                  key={o.id}
                  href={`/orders/${o.id}`}
                  className={`block rounded-lg border p-2 text-sm ${
                    o.outlier ? "border-amber-400 bg-amber-50" : "border-neutral-200"
                  }`}
                >
                  <div className="font-mono">{o.orderNumber}</div>
                  <div className="text-neutral-500">
                    {o.itemCount} item{o.itemCount === 1 ? "" : "s"}
                  </div>
                  {o.outlier && (
                    <div className="mt-1 font-medium text-amber-700">Outlier - bitte prüfen</div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
