import { CUSTOMER_MILESTONES, formatCHF } from "@cutura/core";
import type { CustomerOrderDetail } from "@cutura/db";

import type { Locale } from "@/i18n/config";
import { milestoneLabels } from "@/i18n/messages";

// Server component: renders a customer-safe order detail (milestone progress,
// item summaries, friendly timeline). No internal QC/supplier/cost data.
export function OrderDetailView({
  detail,
  locale,
}: {
  detail: CustomerOrderDetail;
  locale: Locale;
}) {
  const labels = milestoneLabels[locale];
  const reached = CUSTOMER_MILESTONES.indexOf(
    detail.milestone === "attention" ? "received" : detail.milestone,
  );

  return (
    <div>
      <ol className="mt-6 flex flex-wrap gap-2 text-sm">
        {CUSTOMER_MILESTONES.map((m, i) => (
          <li
            key={m}
            className={`rounded px-3 py-1 ${
              i <= reached ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-500"
            }`}
          >
            {labels[m]}
          </li>
        ))}
      </ol>
      {detail.milestone === "attention" && (
        <p className="mt-2 text-sm text-amber-700">{labels.attention}</p>
      )}

      <ul className="mt-6 flex flex-col gap-3">
        {detail.items.map((item) => (
          <li key={item.id} className="rounded-lg border border-neutral-200 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{item.baseModelName}</span>
              <span className="text-neutral-500">{labels[item.milestone]}</span>
            </div>
            {item.fabricCode && <p className="mt-1 text-neutral-500">{item.fabricCode}</p>}
            {item.upgrades.length > 0 && (
              <p className="mt-1 text-neutral-500">{item.upgrades.map((u) => u.code).join(", ")}</p>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-4 text-sm text-neutral-500">{formatCHF(detail.totalMinor)}</div>
    </div>
  );
}
