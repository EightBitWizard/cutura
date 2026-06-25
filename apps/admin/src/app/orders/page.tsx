import Link from "next/link";

import { formatCHF } from "@cutura/core";
import { listOrders } from "@cutura/db";

import { environmentDb } from "@/server/catalog";

export const dynamic = "force-dynamic";

// M3 order ops operate on the staging environment DB (the gate environment). The
// polished multi-environment board is M5.
export default async function OrdersPage() {
  const orders = await listOrders(environmentDb("staging"));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Orders (staging)</h1>
        <Link href="/" className="text-sm text-ink-muted underline">
          Dashboard
        </Link>
      </div>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left text-ink-subtle">
            <th className="py-2">Order</th>
            <th className="py-2">Status</th>
            <th className="py-2">Total</th>
            <th className="py-2">Email</th>
            <th className="py-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-6 text-ink-subtle">
                No orders yet.
              </td>
            </tr>
          ) : (
            orders.map((o) => (
              <tr key={o.id} className="border-b">
                <td className="py-3">
                  <Link href={`/orders/${o.id}`} className="font-mono underline">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="py-3">{o.status}</td>
                <td className="py-3">{formatCHF(o.totalMinor)}</td>
                <td className="py-3 text-ink-subtle">{o.guestEmail ?? "-"}</td>
                <td className="py-3 text-ink-subtle">{o.createdAt.slice(0, 10)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </main>
  );
}
