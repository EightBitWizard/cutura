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
  material: string;
  care: string;
}

interface PriceResponse {
  total: number;
  display: string;
  valid: boolean;
  missingRequired: string[];
}

// Uniform caption block for swatch tiles: a fixed-height area with a two-line-clamped
// label and an always-present surcharge line, so every tile is the same height and the
// images line up regardless of label length or whether there is a surcharge. When
// `reserveMeta` is set (fabric tiles), a third line carries the fibre/weight detail and
// is reserved on every tile so tiles stay aligned even where a fabric has no data.
function SwatchCaption({
  label,
  surchargeMinor = 0,
  meta,
  reserveMeta = false,
}: {
  label: string;
  surchargeMinor?: number;
  meta?: string;
  reserveMeta?: boolean;
}) {
  return (
    <span className="flex min-h-[3.5rem] flex-col gap-0.5 px-2 py-1.5">
      <span className="line-clamp-2 text-xs font-medium leading-tight text-ink">{label}</span>
      <span className="text-xs leading-tight text-ink-subtle">
        {surchargeMinor > 0 ? `+${formatCHF(surchargeMinor)}` : " "}
      </span>
      {reserveMeta ? (
        <span className="line-clamp-1 text-xs leading-tight text-ink-subtle">{meta || " "}</span>
      ) : null}
    </span>
  );
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

  // Mobile-only: the sticky bottom purchase bar appears once the in-flow total + CTA
  // scrolls out of view, so only one primary action is on screen at a time.
  const ctaRef = useRef<HTMLDivElement>(null);
  const [showBar, setShowBar] = useState(false);
  useEffect(() => {
    const el = ctaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setShowBar(!entry.isIntersecting);
      },
      { rootMargin: "0px 0px -4px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

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

  // Fabric as hero: the fibre + weight line shown on each tile, and the material + care
  // detail for the selected fabric. All fields are optional in the published data, so
  // every branch degrades to nothing when a fabric has no data.
  const fabricMeta = (f: PublishedModelDetail["fabrics"][number]): string =>
    [f.fibre, f.weightGsm ? `${f.weightGsm} g/m²` : null].filter(Boolean).join(" · ");
  const anyFabricMeta = model.fabrics.some((f) => fabricMeta(f));
  const selectedFabric = model.fabrics.find((f) => f.code === fabricCode);
  const hasFabricDetail = Boolean(selectedFabric?.material || selectedFabric?.care);

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
  // flex flex-col keeps the image top-aligned (a button centers its content by default,
  // which otherwise pushes shorter tiles' images down out of line).
  const tile = (active: boolean) =>
    `flex flex-col overflow-hidden rounded-sm border text-left transition-colors ${
      active ? "border-accent ring-1 ring-accent" : "border-line hover:border-line-strong"
    }`;

  return (
    <>
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
                    className={tile(active)}
                  >
                    <MediaImage
                      mediaId={f.mediaId}
                      alt=""
                      className="aspect-square w-full bg-sunken object-cover"
                    />
                    <SwatchCaption
                      label={f.name}
                      surchargeMinor={f.surchargeMinor}
                      meta={fabricMeta(f)}
                      reserveMeta={anyFabricMeta}
                    />
                  </button>
                );
              })}
            </div>

            {hasFabricDetail && (
              <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
                {selectedFabric?.material ? (
                  <div className="flex gap-3">
                    <dt className="w-20 shrink-0 text-ink-subtle">{t.material}</dt>
                    <dd className="text-ink-muted">{selectedFabric.material}</dd>
                  </div>
                ) : null}
                {selectedFabric?.care ? (
                  <div className="flex gap-3">
                    <dt className="w-20 shrink-0 text-ink-subtle">{t.care}</dt>
                    <dd className="text-ink-muted">{selectedFabric.care}</dd>
                  </div>
                ) : null}
              </dl>
            )}
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
                      <MediaImage
                        mediaId={g.noneMediaId}
                        alt=""
                        className="aspect-square w-full bg-sunken object-cover"
                      />
                      <SwatchCaption label={t.none} />
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
                      <SwatchCaption label={v.label} surchargeMinor={v.surchargeMinor} />
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

        <div ref={ctaRef} className="border-t border-line pt-5">
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

      {/* Mobile-only sticky purchase bar: mirrors the in-flow total + CTA (no new price
          logic) and slides in once the in-flow action scrolls out of view. Hidden on lg,
          where the configurator column is sticky instead. */}
      <div
        aria-hidden={!showBar}
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface shadow-bar transition-transform duration-200 ease-out lg:hidden ${
          showBar ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div
          className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 pt-3"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
        >
          <div className="min-w-0">
            <p className="text-eyebrow uppercase text-ink-subtle">{t.total}</p>
            <p
              className={`text-lg font-semibold tabular-nums text-ink transition-opacity ${
                pending ? "opacity-50" : "opacity-100"
              }`}
            >
              {display}
            </p>
          </div>
          <button
            type="button"
            disabled={!valid || submitting || paused}
            onClick={addToCart}
            tabIndex={showBar ? undefined : -1}
            className={buttonClasses("primary", "md", "shrink-0")}
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
    </>
  );
}
