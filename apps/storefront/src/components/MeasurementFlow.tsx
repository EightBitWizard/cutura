"use client";

import { useState } from "react";

import { garmentFields, wizardBaseFields } from "@cutura/core";

import type { MeasureMessages, MeasurementFieldLabels } from "@/i18n/messages";

type FieldKey = keyof MeasurementFieldLabels;
type Confirmed = Record<string, number>;
type WizBase = "chest" | "waist" | "hips";

type Step = "choose" | "wizard" | "review" | "detailed";
type Unit = "cm" | "in";
type Fit = "slim" | "regular" | "relaxed";

function toDisplay(cm: number, unit: Unit): string {
  if (!cm) return "";
  return unit === "in" ? (cm / 2.54).toFixed(1) : String(cm);
}
function fromDisplay(value: string, unit: Unit): number {
  const n = Number.parseFloat(value);
  if (Number.isNaN(n)) return 0;
  return unit === "in" ? Math.round(n * 2.54 * 10) / 10 : n;
}

const input = "mt-1 w-full rounded border border-neutral-300 px-2 py-1";

export function MeasurementFlow({
  garmentType,
  messages: t,
  returnUrl,
}: {
  locale: string;
  garmentType: string;
  messages: MeasureMessages;
  returnUrl: string;
}) {
  const fields = garmentFields(garmentType) as FieldKey[];
  const baseInputs = wizardBaseFields(garmentType) as WizBase[];
  const empty: Confirmed = Object.fromEntries(fields.map((f) => [f, 0]));

  const [step, setStep] = useState<Step>("choose");
  const [unit, setUnit] = useState<Unit>("cm");
  const [wiz, setWiz] = useState({
    height: 0,
    weight: 0,
    chest: 0,
    waist: 0,
    hips: 0,
    fit: "regular" as Fit,
  });
  const [confirmed, setConfirmed] = useState<Confirmed>(empty);
  const [derived, setDerived] = useState<Confirmed>({});
  const [confidence, setConfidence] = useState<"high" | "medium" | "low" | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [method, setMethod] = useState<"wizard" | "detailed">("wizard");
  const [saving, setSaving] = useState(false);
  const [outlier, setOutlier] = useState<string[] | null>(null);

  const confidenceLabel =
    confidence === "high"
      ? t.confidenceHigh
      : confidence === "medium"
        ? t.confidenceMedium
        : confidence === "low"
          ? t.confidenceLow
          : "";

  async function runEstimate() {
    setSaving(true);
    try {
      const res = await fetch("/api/measurement", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          op: "estimate",
          garmentType,
          input: {
            heightCm: wiz.height,
            weightKg: wiz.weight,
            chestCm: wiz.chest,
            waistCm: wiz.waist,
            hipsCm: wiz.hips,
            fitPreference: wiz.fit,
          },
        }),
      });
      const data = (await res.json()) as {
        fallback?: boolean;
        derived?: Confirmed;
        confidenceLevel?: "high" | "medium" | "low";
        warnings?: string[];
      };
      if (data.fallback) {
        setMethod("detailed");
        setStep("detailed");
        return;
      }
      const d = data.derived ?? {};
      setDerived(d);
      setConfidence(data.confidenceLevel ?? null);
      setWarnings(data.warnings ?? []);
      // Confirmed = the derived values plus the base inputs the customer entered.
      const next: Confirmed = { ...empty, ...d };
      for (const b of baseInputs) next[b] = wiz[b];
      setConfirmed(next);
      setMethod("wizard");
      setStep("review");
    } finally {
      setSaving(false);
    }
  }

  async function confirm() {
    setSaving(true);
    try {
      const originalInputs =
        method === "wizard"
          ? Object.fromEntries(baseInputs.map((b) => [b, wiz[b]]))
          : { ...confirmed };
      const res = await fetch("/api/measurement", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          op: "confirm",
          garmentType,
          method,
          originalInputs,
          derivedValues: method === "wizard" ? derived : {},
          confirmedValues: confirmed,
        }),
      });
      const data = (await res.json()) as { isOutlier?: boolean; flags?: string[] };
      if (data.isOutlier) setOutlier(data.flags ?? []);
      else window.location.href = returnUrl;
    } finally {
      setSaving(false);
    }
  }

  if (outlier) {
    return (
      <div className="mt-8 rounded-lg border border-amber-300 bg-amber-50 p-4">
        <p className="text-amber-800">{t.outlierNotice}</p>
        <button
          type="button"
          onClick={() => {
            window.location.href = returnUrl;
          }}
          className="mt-4 rounded-md bg-neutral-900 px-4 py-2 font-medium text-white"
        >
          {t.confirm}
        </button>
      </div>
    );
  }

  const unitToggle = (
    <div className="mt-2 flex gap-2 text-sm">
      {(["cm", "in"] as Unit[]).map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => setUnit(u)}
          className={`rounded border px-2 py-1 ${
            unit === u ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"
          }`}
        >
          {u === "cm" ? t.unitCm : t.unitInch}
        </button>
      ))}
    </div>
  );

  function fieldGrid(canEdit: boolean) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-3">
        {fields.map((f) => (
          <label key={f} className="flex flex-col text-sm">
            {t.fields[f]}
            {derived[f] !== undefined && method === "wizard" ? (
              <span className="text-xs text-neutral-400">{confidenceLabel}</span>
            ) : null}
            <input
              type="number"
              inputMode="decimal"
              value={toDisplay(confirmed[f] ?? 0, unit)}
              onChange={(e) =>
                setConfirmed((c) => ({ ...c, [f]: fromDisplay(e.target.value, unit) }))
              }
              disabled={!canEdit}
              className={input}
            />
          </label>
        ))}
      </div>
    );
  }

  if (step === "choose") {
    return (
      <div className="mt-6">
        <p className="text-neutral-600">{t.intro}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setMethod("wizard");
              setStep("wizard");
            }}
            className="rounded-lg border border-neutral-300 p-4 text-left hover:border-neutral-500"
          >
            <span className="font-medium">{t.wizardCard}</span>
            <span className="mt-1 block text-sm text-neutral-500">{t.wizardDesc}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMethod("detailed");
              setConfirmed(empty);
              setStep("detailed");
            }}
            className="rounded-lg border border-neutral-300 p-4 text-left hover:border-neutral-500"
          >
            <span className="font-medium">{t.detailedCard}</span>
            <span className="mt-1 block text-sm text-neutral-500">{t.detailedDesc}</span>
          </button>
        </div>
      </div>
    );
  }

  if (step === "wizard") {
    return (
      <div className="mt-6">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col text-sm">
            {t.height} (cm)
            <input
              type="number"
              value={wiz.height || ""}
              onChange={(e) =>
                setWiz((w) => ({ ...w, height: Number.parseFloat(e.target.value) || 0 }))
              }
              className={input}
            />
          </label>
          <label className="flex flex-col text-sm">
            {t.weight} (kg)
            <input
              type="number"
              value={wiz.weight || ""}
              onChange={(e) =>
                setWiz((w) => ({ ...w, weight: Number.parseFloat(e.target.value) || 0 }))
              }
              className={input}
            />
          </label>
          {baseInputs.map((k) => (
            <label key={k} className="flex flex-col text-sm">
              {t.fields[k]} (cm)
              <input
                type="number"
                value={wiz[k] || ""}
                onChange={(e) =>
                  setWiz((w) => ({ ...w, [k]: Number.parseFloat(e.target.value) || 0 }))
                }
                className={input}
              />
            </label>
          ))}
          <label className="flex flex-col text-sm">
            {t.fit}
            <select
              value={wiz.fit}
              onChange={(e) => setWiz((w) => ({ ...w, fit: e.target.value as Fit }))}
              className={input}
            >
              <option value="slim">{t.fitSlim}</option>
              <option value="regular">{t.fitRegular}</option>
              <option value="relaxed">{t.fitRelaxed}</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setStep("choose")}
            className="rounded border border-neutral-300 px-3 py-2 text-sm"
          >
            {t.back}
          </button>
          <button
            type="button"
            onClick={runEstimate}
            disabled={saving}
            className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white disabled:opacity-40"
          >
            {saving ? t.saving : t.estimate}
          </button>
        </div>
      </div>
    );
  }

  if (step === "review") {
    return (
      <div className="mt-6">
        <h2 className="text-lg font-medium">{t.reviewTitle}</h2>
        <p className="mt-1 text-sm text-neutral-600">{t.reviewIntro}</p>
        {confidenceLabel && <p className="mt-1 text-sm text-neutral-500">{confidenceLabel}</p>}
        {warnings.map((w, i) => (
          <p key={i} className="mt-1 text-sm text-amber-700">
            {w}
          </p>
        ))}
        {unitToggle}
        {fieldGrid(true)}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setStep("wizard")}
            className="rounded border border-neutral-300 px-3 py-2 text-sm"
          >
            {t.back}
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={saving}
            className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white disabled:opacity-40"
          >
            {saving ? t.saving : t.confirm}
          </button>
        </div>
      </div>
    );
  }

  // detailed
  return (
    <div className="mt-6">
      <h2 className="text-lg font-medium">{t.detailedTitle}</h2>
      {unitToggle}
      {fieldGrid(true)}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setStep("choose")}
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        >
          {t.back}
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={saving}
          className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white disabled:opacity-40"
        >
          {saving ? t.saving : t.confirm}
        </button>
      </div>
    </div>
  );
}
