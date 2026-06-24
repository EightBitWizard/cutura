"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { formatCHF, priceConfiguration } from "@cutura/core";
import type { PublishedModelDetail } from "@cutura/db";

export interface ConfiguratorMessages {
  fabric: string;
  options: string;
  upgrades: string;
  required: string;
  none: string;
  total: string;
  allInclusive: string;
  selectRequired: string;
  addToCart: string;
  recalculating: string;
}

interface PriceResponse {
  total: number;
  display: string;
  valid: boolean;
  missingRequired: string[];
}

export function Configurator({
  model,
  locale,
  messages: t,
}: {
  model: PublishedModelDetail;
  locale: string;
  messages: ConfiguratorMessages;
}) {
  // Fast-path defaults (FR-460/461): first available fabric, first value of each
  // required group, no upgrades. Yields a valid configuration immediately.
  const [fabricCode, setFabricCode] = useState<string | null>(model.fabrics[0]?.code ?? null);
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const g of model.optionGroups) init[g.code] = g.required ? (g.values[0]?.code ?? "") : "";
    return init;
  });
  const [upgrades, setUpgrades] = useState<Set<string>>(() => new Set());
  const [server, setServer] = useState<PriceResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const seqRef = useRef(0);

  const optionValueCodes = useMemo(
    () => Object.values(selected).filter((c) => c !== ""),
    [selected],
  );
  const upgradeCodes = useMemo(() => [...upgrades], [upgrades]);

  // Optimistic client price from the same catalog surcharges (presentational only).
  const optimistic = useMemo(() => {
    const fabric = model.fabrics.find((f) => f.code === fabricCode);
    const optionSurcharges = model.optionGroups
      .flatMap((g) => g.values)
      .filter((v) => optionValueCodes.includes(v.code))
      .map((v) => v.surchargeMinor);
    const upgradePrices = model.upgrades
      .filter((u) => upgradeCodes.includes(u.code))
      .map((u) => u.priceMinor);
    return priceConfiguration({
      basePriceMinor: model.basePriceMinor,
      fabricSurchargeMinor: fabric?.surchargeMinor ?? 0,
      optionSurchargesMinor: optionSurcharges,
      upgradePricesMinor: upgradePrices,
    });
  }, [model, fabricCode, optionValueCodes, upgradeCodes]);

  const localMissing = useMemo(
    () => model.optionGroups.filter((g) => g.required && !selected[g.code]).map((g) => g.code),
    [model, selected],
  );
  const localValid =
    localMissing.length === 0 && (model.fabrics.length === 0 || fabricCode !== null);

  // Debounced server-authoritative recompute; the server result supersedes the optimistic value.
  useEffect(() => {
    const seq = ++seqRef.current;
    const timer = setTimeout(async () => {
      setPending(true);
      try {
        const res = await fetch("/api/price", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            handle: model.handle,
            locale,
            fabricCode,
            optionValueCodes,
            upgradeCodes,
          }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as PriceResponse;
        if (seq === seqRef.current) setServer(data);
      } finally {
        if (seq === seqRef.current) setPending(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [model.handle, locale, fabricCode, optionValueCodes, upgradeCodes]);

  const display = server && !pending ? server.display : formatCHF(optimistic.total);
  const valid = server && !pending ? server.valid : localValid;

  async function addToCart() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handle: model.handle, fabricCode, optionValueCodes, upgradeCodes }),
      });
      if (res.ok) {
        window.location.href = `/${locale}/measure?return=/${locale}/cart`;
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8 flex flex-col gap-8">
      {model.fabrics.length > 0 && (
        <section>
          <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500">
            {t.fabric}
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {model.fabrics.map((f) => (
              <button
                key={f.code}
                type="button"
                onClick={() => setFabricCode(f.code)}
                className={`rounded border px-3 py-2 text-sm ${
                  fabricCode === f.code
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300"
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {model.optionGroups.map((g) => (
        <section key={g.code}>
          <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500">
            {g.label} {g.required ? <span className="text-neutral-400">({t.required})</span> : null}
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {!g.required && (
              <button
                type="button"
                onClick={() => setSelected((s) => ({ ...s, [g.code]: "" }))}
                className={`rounded border px-3 py-2 text-sm ${
                  selected[g.code] === ""
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300"
                }`}
              >
                {t.none}
              </button>
            )}
            {g.values.map((v) => (
              <button
                key={v.code}
                type="button"
                onClick={() => setSelected((s) => ({ ...s, [g.code]: v.code }))}
                className={`rounded border px-3 py-2 text-sm ${
                  selected[g.code] === v.code
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300"
                }`}
              >
                {v.label}
                {v.surchargeMinor > 0 ? ` (+${formatCHF(v.surchargeMinor)})` : ""}
              </button>
            ))}
          </div>
        </section>
      ))}

      {model.upgrades.length > 0 && (
        <section>
          <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500">
            {t.upgrades}
          </h2>
          <div className="mt-2 flex flex-col gap-1">
            {model.upgrades.map((u) => (
              <label key={u.code} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={upgrades.has(u.code)}
                  onChange={(e) =>
                    setUpgrades((prev) => {
                      const next = new Set(prev);
                      if (e.target.checked) next.add(u.code);
                      else next.delete(u.code);
                      return next;
                    })
                  }
                />
                {u.name}
                {u.priceMinor > 0 ? ` (+${formatCHF(u.priceMinor)})` : ""}
              </label>
            ))}
          </div>
        </section>
      )}

      <div className="border-t pt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-neutral-500">{t.total}</span>
          <span className="text-2xl font-semibold">{display}</span>
        </div>
        <p className="text-xs text-neutral-400">{pending ? t.recalculating : t.allInclusive}</p>
        {!valid && <p className="mt-2 text-sm text-amber-700">{t.selectRequired}</p>}
        <button
          type="button"
          disabled={!valid || submitting}
          onClick={addToCart}
          className="mt-4 w-full rounded-md bg-neutral-900 px-4 py-3 font-medium text-white disabled:opacity-40"
        >
          {t.addToCart}
        </button>
      </div>
    </div>
  );
}
