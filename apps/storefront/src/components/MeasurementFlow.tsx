"use client";

import { useState } from "react";

import { garmentFields, wizardBaseFields } from "@cutura/core";

import { buttonClasses } from "@/components/ui/buttonClasses";
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

const input =
  "mt-1 w-full rounded-sm border border-line-strong bg-surface px-3 py-2 text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-paper disabled:bg-sunken disabled:text-ink-muted";

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
  const [requestError, setRequestError] = useState<string | null>(null);

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
    setRequestError(null);
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
      if (!res.ok) {
        // Stay on the wizard and say so; detailed entry remains available.
        setRequestError(t.estimateError);
        return;
      }
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
    } catch {
      setRequestError(t.estimateError);
    } finally {
      setSaving(false);
    }
  }

  async function confirm() {
    setSaving(true);
    setRequestError(null);
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
      if (!res.ok) {
        // A failed confirm must never redirect as if it succeeded.
        setRequestError(t.saveError);
        return;
      }
      const data = (await res.json()) as { isOutlier?: boolean; flags?: string[] };
      if (data.isOutlier) setOutlier(data.flags ?? []);
      else window.location.assign(returnUrl);
    } catch {
      setRequestError(t.saveError);
    } finally {
      setSaving(false);
    }
  }

  if (outlier) {
    return (
      <div className="mt-8 rounded-md border border-warning/40 bg-warning/5 p-4">
        <p className="text-sm text-ink">{t.outlierNotice}</p>
        <button
          type="button"
          onClick={() => {
            window.location.href = returnUrl;
          }}
          className={buttonClasses("primary", "md", "mt-4")}
        >
          {t.confirm}
        </button>
      </div>
    );
  }

  const requestErrorNotice = requestError ? (
    <p role="alert" className="mt-3 text-sm text-accent">
      {requestError}
    </p>
  ) : null;

  const unitToggle = (
    <div className="mt-2 flex gap-2 text-sm">
      {(["cm", "in"] as Unit[]).map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => setUnit(u)}
          className={`rounded-sm border px-3 py-1.5 transition-colors ${
            unit === u
              ? "border-ink bg-ink text-paper"
              : "border-line-strong text-ink hover:border-ink"
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
          <label key={f} className="flex flex-col gap-1 text-sm font-medium text-ink">
            {t.fields[f]}
            {derived[f] !== undefined && method === "wizard" ? (
              <span className="text-xs font-normal text-ink-subtle">{confidenceLabel}</span>
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
        <p className="text-ink-muted">{t.intro}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setMethod("wizard");
              setStep("wizard");
            }}
            className="rounded-md border border-line bg-surface p-4 text-left transition-colors hover:border-ink"
          >
            <span className="font-medium text-ink">{t.wizardCard}</span>
            <span className="mt-1 block text-sm text-ink-subtle">{t.wizardDesc}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMethod("detailed");
              setConfirmed(empty);
              setStep("detailed");
            }}
            className="rounded-md border border-line bg-surface p-4 text-left transition-colors hover:border-ink"
          >
            <span className="font-medium text-ink">{t.detailedCard}</span>
            <span className="mt-1 block text-sm text-ink-subtle">{t.detailedDesc}</span>
          </button>
        </div>
      </div>
    );
  }

  if (step === "wizard") {
    return (
      <div className="mt-6">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-ink">
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
          <label className="flex flex-col gap-1 text-sm font-medium text-ink">
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
            <label key={k} className="flex flex-col gap-1 text-sm font-medium text-ink">
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
          <label className="flex flex-col gap-1 text-sm font-medium text-ink">
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
        {requestErrorNotice}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setRequestError(null);
              setStep("choose");
            }}
            className={buttonClasses("secondary", "md")}
          >
            {t.back}
          </button>
          <button
            type="button"
            onClick={runEstimate}
            disabled={saving}
            className={buttonClasses("primary", "md")}
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
        <h2 className="text-lg font-medium text-ink">{t.reviewTitle}</h2>
        <p className="mt-1 text-sm text-ink-muted">{t.reviewIntro}</p>
        {confidenceLabel && <p className="mt-1 text-sm text-ink-subtle">{confidenceLabel}</p>}
        {warnings.map((w, i) => (
          <p key={i} className="mt-1 text-sm text-warning">
            {w}
          </p>
        ))}
        {unitToggle}
        {fieldGrid(true)}
        {requestErrorNotice}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setRequestError(null);
              setStep("wizard");
            }}
            className={buttonClasses("secondary", "md")}
          >
            {t.back}
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={saving}
            className={buttonClasses("primary", "md")}
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
      <h2 className="text-lg font-medium text-ink">{t.detailedTitle}</h2>
      {unitToggle}
      {fieldGrid(true)}
      {requestErrorNotice}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setRequestError(null);
            setStep("choose");
          }}
          className={buttonClasses("secondary", "md")}
        >
          {t.back}
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={saving}
          className={buttonClasses("primary", "md")}
        >
          {saving ? t.saving : t.confirm}
        </button>
      </div>
    </div>
  );
}
