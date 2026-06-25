import { CUSTOMER_MILESTONES, formatCHF, formatDate } from "@cutura/core";
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
              i <= reached ? "bg-ink text-paper" : "bg-sunken text-ink-subtle"
            }`}
          >
            {labels[m]}
          </li>
        ))}
      </ol>
      {detail.milestone === "attention" && (
        <p className="mt-2 text-sm text-warning">{labels.attention}</p>
      )}

      <ul className="mt-6 flex flex-col gap-3">
        {detail.items.map((item) => (
          <li key={item.id} className="rounded-lg border border-line p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{item.baseModelName}</span>
              <span className="text-ink-subtle">{labels[item.milestone]}</span>
            </div>
            {item.fabricCode && <p className="mt-1 text-ink-subtle">{item.fabricCode}</p>}
            {item.upgrades.length > 0 && (
              <p className="mt-1 text-ink-subtle">{item.upgrades.map((u) => u.code).join(", ")}</p>
            )}
          </li>
        ))}
      </ul>

      {detail.timeline.length > 0 && (
        <ul className="mt-6 flex flex-col gap-1 text-sm text-ink-subtle">
          {detail.timeline.map((e, i) => (
            <li key={`${e.milestone}-${i}`}>
              {formatDate(e.at, locale)} - {labels[e.milestone]}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 text-sm text-ink-subtle">{formatCHF(detail.totalMinor)}</div>
    </div>
  );
}
