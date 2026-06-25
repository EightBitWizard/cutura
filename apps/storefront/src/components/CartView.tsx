"use client";

import { useState } from "react";

import { formatCHF } from "@cutura/core";

export interface CartLineView {
  index: number;
  handle: string;
  name: string;
  fabric: string | null;
  base: number;
  options: Array<{ label: string; surcharge: number }>;
  upgrades: Array<{ name: string; price: number }>;
  total: number;
  valid: boolean;
}

export function CartView({
  lines,
  labels,
}: {
  lines: CartLineView[];
  labels: { remove: string; base: string };
}) {
  const [busy, setBusy] = useState<number | null>(null);

  async function remove(index: number) {
    setBusy(index);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "remove", index }),
      });
      if (res.ok) window.location.reload();
    } finally {
      setBusy(null);
    }
  }

  return (
    <ul className="mt-6 flex flex-col gap-4">
      {lines.map((line) => (
        <li key={line.index} className="rounded-md border border-line bg-surface p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-ink">{line.name}</p>
              {line.fabric && <p className="mt-0.5 text-sm text-ink-subtle">{line.fabric}</p>}
            </div>
            <p className="shrink-0 text-lg font-semibold tabular-nums text-ink">
              {formatCHF(line.total)}
            </p>
          </div>
          <dl className="mt-3 space-y-1 text-sm text-ink-muted">
            <div className="flex justify-between">
              <dt>{labels.base}</dt>
              <dd className="tabular-nums">{formatCHF(line.base)}</dd>
            </div>
            {line.options.map((o, i) => (
              <div key={`o${i}`} className="flex justify-between">
                <dt>{o.label}</dt>
                <dd className="tabular-nums">
                  {o.surcharge > 0 ? `+${formatCHF(o.surcharge)}` : "-"}
                </dd>
              </div>
            ))}
            {line.upgrades.map((u, i) => (
              <div key={`u${i}`} className="flex justify-between">
                <dt>{u.name}</dt>
                <dd className="tabular-nums">{u.price > 0 ? `+${formatCHF(u.price)}` : "-"}</dd>
              </div>
            ))}
          </dl>
          <button
            type="button"
            onClick={() => remove(line.index)}
            disabled={busy === line.index}
            className="mt-4 text-sm text-ink-subtle underline transition-colors hover:text-ink disabled:opacity-40"
          >
            {labels.remove}
          </button>
        </li>
      ))}
    </ul>
  );
}
