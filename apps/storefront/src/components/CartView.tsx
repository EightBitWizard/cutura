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
        <li key={line.index} className="rounded-lg border border-neutral-200 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium">{line.name}</p>
              {line.fabric && <p className="text-sm text-neutral-500">{line.fabric}</p>}
            </div>
            <p className="text-lg font-semibold">{formatCHF(line.total)}</p>
          </div>
          <dl className="mt-2 space-y-0.5 text-sm text-neutral-500">
            <div className="flex justify-between">
              <dt>{labels.base}</dt>
              <dd>{formatCHF(line.base)}</dd>
            </div>
            {line.options.map((o, i) => (
              <div key={`o${i}`} className="flex justify-between">
                <dt>{o.label}</dt>
                <dd>{o.surcharge > 0 ? `+${formatCHF(o.surcharge)}` : "-"}</dd>
              </div>
            ))}
            {line.upgrades.map((u, i) => (
              <div key={`u${i}`} className="flex justify-between">
                <dt>{u.name}</dt>
                <dd>{u.price > 0 ? `+${formatCHF(u.price)}` : "-"}</dd>
              </div>
            ))}
          </dl>
          <button
            type="button"
            onClick={() => remove(line.index)}
            disabled={busy === line.index}
            className="mt-3 text-sm text-neutral-500 underline disabled:opacity-40"
          >
            {labels.remove}
          </button>
        </li>
      ))}
    </ul>
  );
}
