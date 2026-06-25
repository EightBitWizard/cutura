"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { formatCHF, priceConfiguration } from "@cutura/core";
import type { PublishedModelDetail } from "@cutura/db";

import { MediaImage } from "@/components/MediaImage";
import { buttonClasses } from "@/components/ui/buttonClasses";

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
  paused = false,
  messages: t,
}: {
  model: PublishedModelDetail;
  locale: string;
  paused?: boolean;
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
        window.location.href = `/${locale}/measure?gt=${model.garmentType}&return=/${locale}/cart`;
      }
    } finally {
      setSubmitting(false);
    }
  }

  const groupLabel = "text-eyebrow uppercase text-ink-subtle";
  const pill = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-sm border px-3 py-2 text-sm transition-colors ${
      active ? "border-ink bg-ink text-paper" : "border-line-strong text-ink hover:border-ink"
    }`;
  const tile = (active: boolean) =>
    `overflow-hidden rounded-sm border text-left transition-colors ${
      active ? "border-accent ring-1 ring-accent" : "border-line hover:border-line-strong"
    }`;

  return (
    <div className="mt-8 flex flex-col gap-8">
      {model.fabrics.length > 0 && (
        <section>
          <h2 className={groupLabel}>{t.fabric}</h2>
          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {model.fabrics.map((f) => {
              const active = fabricCode === f.code;
              return (
                <button
                  key={f.code}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFabricCode(f.code)}
                  className={`overflow-hidden rounded-sm border text-left transition-colors ${
                    active
                      ? "border-accent ring-1 ring-accent"
                      : "border-line hover:border-line-strong"
                  }`}
                >
                  <MediaImage
                    mediaId={f.mediaId}
                    alt=""
                    className="aspect-square w-full bg-sunken object-cover"
                  />
                  <span className="block px-2 py-1.5">
                    <span className="block text-xs font-medium text-ink">{f.name}</span>
                    {f.surchargeMinor > 0 ? (
                      <span className="block text-xs text-ink-subtle">
                        +{formatCHF(f.surchargeMinor)}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {model.optionGroups.map((g) => {
        const hasImages = g.values.some((v) => v.mediaId);
        return (
          <section key={g.code}>
            <h2 className={groupLabel}>
              {g.label}
              {g.required ? (
                <span className="ml-1 lowercase tracking-normal text-ink-subtle">
                  ({t.required})
                </span>
              ) : null}
            </h2>

            {hasImages ? (
              // Visual swatch tiles when any value in the group carries an image
              // (e.g. collar styles), so customers can see the options.
              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {!g.required && (
                  <button
                    type="button"
                    aria-pressed={selected[g.code] === ""}
                    onClick={() => setSelected((s) => ({ ...s, [g.code]: "" }))}
                    className={tile(selected[g.code] === "")}
                  >
                    <span className="block aspect-square w-full bg-sunken" aria-hidden="true" />
                    <span className="block px-2 py-1.5 text-xs font-medium text-ink">{t.none}</span>
                  </button>
                )}
                {g.values.map((v) => (
                  <button
                    key={v.code}
                    type="button"
                    aria-pressed={selected[g.code] === v.code}
                    onClick={() => setSelected((s) => ({ ...s, [g.code]: v.code }))}
                    className={tile(selected[g.code] === v.code)}
                  >
                    <MediaImage
                      mediaId={v.mediaId}
                      alt=""
                      className="aspect-square w-full bg-sunken object-cover"
                    />
                    <span className="block px-2 py-1.5">
                      <span className="block text-xs font-medium text-ink">{v.label}</span>
                      {v.surchargeMinor > 0 ? (
                        <span className="block text-xs text-ink-subtle">
                          +{formatCHF(v.surchargeMinor)}
                        </span>
                      ) : null}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {!g.required && (
                  <button
                    type="button"
                    aria-pressed={selected[g.code] === ""}
                    onClick={() => setSelected((s) => ({ ...s, [g.code]: "" }))}
                    className={pill(selected[g.code] === "")}
                  >
                    {t.none}
                  </button>
                )}
                {g.values.map((v) => (
                  <button
                    key={v.code}
                    type="button"
                    aria-pressed={selected[g.code] === v.code}
                    onClick={() => setSelected((s) => ({ ...s, [g.code]: v.code }))}
                    className={pill(selected[g.code] === v.code)}
                  >
                    {v.label}
                    {v.surchargeMinor > 0 ? ` (+${formatCHF(v.surchargeMinor)})` : ""}
                  </button>
                ))}
              </div>
            )}
          </section>
        );
      })}

      {model.upgrades.length > 0 && (
        <section>
          <h2 className={groupLabel}>{t.upgrades}</h2>
          <div className="mt-3 flex flex-col gap-2">
            {model.upgrades.map((u) => {
              const on = upgrades.has(u.code);
              return (
                <label
                  key={u.code}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-sm border px-3 py-2.5 text-sm transition-colors ${
                    on ? "border-ink bg-sunken" : "border-line hover:border-line-strong"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={(e) =>
                        setUpgrades((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(u.code);
                          else next.delete(u.code);
                          return next;
                        })
                      }
                      className="h-4 w-4 accent-ink"
                    />
                    {u.mediaId ? (
                      <MediaImage
                        mediaId={u.mediaId}
                        alt=""
                        className="h-8 w-8 rounded-[2px] object-cover"
                      />
                    ) : null}
                    <span className="text-ink">{u.name}</span>
                  </span>
                  {u.priceMinor > 0 ? (
                    <span className="shrink-0 text-ink-muted">+{formatCHF(u.priceMinor)}</span>
                  ) : null}
                </label>
              );
            })}
          </div>
        </section>
      )}

      <div className="border-t border-line pt-5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-ink-muted">{t.total}</span>
          <span
            className={`text-2xl font-semibold tabular-nums text-ink transition-opacity ${
              pending ? "opacity-50" : "opacity-100"
            }`}
          >
            {display}
          </span>
        </div>
        <p className="mt-1 text-eyebrow uppercase text-ink-subtle">
          {pending ? t.recalculating : t.allInclusive}
        </p>
        {!valid && <p className="mt-2 text-sm text-accent">{t.selectRequired}</p>}
        <button
          type="button"
          disabled={!valid || submitting || paused}
          onClick={addToCart}
          className={buttonClasses("primary", "lg", "mt-4 w-full")}
        >
          {submitting ? (
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-paper/40 border-t-paper"
            />
          ) : null}
          {t.addToCart}
        </button>
      </div>
    </div>
  );
}
