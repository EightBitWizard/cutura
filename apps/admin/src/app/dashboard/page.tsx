import Link from "next/link";

import { computeKpis } from "@cutura/db";

import { environmentDb } from "@/server/catalog";
import { getEnv } from "@/server/env";

export const dynamic = "force-dynamic";

const chf = (minor: number) => `${(minor / 100).toFixed(2)} CHF`;
const pct = (r: number) => `${Math.round(r * 100)}%`;

export default async function DashboardPage() {
  const k = await computeKpis(environmentDb("staging"), getEnv().MEASUREMENT_ENCRYPTION_KEY);

  const cards: Array<{ label: string; value: string }> = [
    { label: "Orders", value: String(k.totalOrders) },
    { label: "Paid orders", value: String(k.paidOrders) },
    { label: "Revenue", value: chf(k.revenueMinor) },
    { label: "Measurement completion", value: pct(k.measurementCompletionRate) },
    { label: "Review/outlier rate", value: pct(k.outlierRate) },
    { label: "Remake rate", value: pct(k.remakeRate) },
    {
      label: "Avg lead time",
      value: k.avgLeadTimeDays === null ? "-" : `${k.avgLeadTimeDays.toFixed(1)} d`,
    },
    { label: "Avg margin", value: k.avgMarginMinor === null ? "-" : chf(k.avgMarginMinor) },
    { label: "Reorder rate", value: pct(k.reorderRate) },
  ];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <Link href="/" className="text-sm text-neutral-600 underline">
          Home
        </Link>
      </div>
      <p className="mt-1 text-sm text-neutral-500">Soft-launch KPIs (staging)</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-neutral-200 p-4">
            <div className="text-sm text-neutral-500">{c.label}</div>
            <div className="mt-1 text-2xl font-semibold">{c.value}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
