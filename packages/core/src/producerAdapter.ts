// Producer adapter seam. Turns the standardized SupplierSpec into a
// producer-facing order document, decoupled from HOW it reaches the producer:
// mode "email" keeps the classic spec-email + PDF path, mode "manual" renders an
// English order sheet the founder types into the producer's portal (Kutetailor
// launch mode), mode "api" builds the same canonical payload for automated
// submission once the producer's API is confirmed. The mode is configured per
// supplier in the supplier.capabilities JSON and read via
// parseSupplierCapabilities; switching manual -> api is a data change, not a
// code change (see docs/DECISIONS ADR on the Kutetailor producer seam).

import { MEASUREMENT_FIELD_LABELS_EN } from "./garment";
import type { SupplierSpec } from "./supplierSpec";

export type ProducerMode = "email" | "manual" | "api";

export interface SupplierCapabilities {
  /** Producer adapter key (e.g. "kutetailor"); null keeps the classic email path. */
  adapter: string | null;
  mode: ProducerMode;
}

/**
 * Safe parse of the supplier.capabilities JSON column. Unknown shapes fall back
 * to the classic email path; an adapter without a valid mode falls back to
 * "manual" (human in the loop is the safe default).
 */
export function parseSupplierCapabilities(raw: unknown): SupplierCapabilities {
  if (!raw || typeof raw !== "object") return { adapter: null, mode: "email" };
  const adapter = (raw as { adapter?: unknown }).adapter;
  if (typeof adapter !== "string" || adapter.length === 0) {
    return { adapter: null, mode: "email" };
  }
  const mode = (raw as { mode?: unknown }).mode;
  return { adapter, mode: mode === "api" ? "api" : "manual" };
}

/** External codes for one producer, keyed by CUTURA catalog codes (stable across environments). */
export interface ProducerCodeMap {
  /** External style code for the base model. */
  model?: string;
  /** External fabric code for the CUTURA fabric code. */
  fabric?: string;
  /** "groupCode:valueCode" -> external option code. */
  options?: Record<string, string>;
  /** upgradeCode -> external code. */
  upgrades?: Record<string, string>;
}

export interface SheetLine {
  label: string;
  value: string;
  externalCode: string | null;
}

export interface ProducerOrderSheet {
  producer: string;
  orderNumber: string;
  itemRef: string;
  garmentType: string;
  styleName: string;
  styleCode: string | null;
  fabricCode: string;
  fabricExternalCode: string | null;
  configuration: SheetLine[];
  upgrades: SheetLine[];
  measurementsCm: Array<{ field: string; label: string; value: number }>;
  labelInstruction: string;
  missingMappings: string[];
}

export interface BuildSheetContext {
  producer: string;
  orderNumber: string;
  itemRef: string;
  mapping: ProducerCodeMap;
}

/**
 * Build the producer order sheet from the frozen supplier spec. Pure; missing
 * external codes never block the sheet (the founder can resolve them in the
 * portal), they are listed in missingMappings instead.
 */
export function buildProducerOrderSheet(
  spec: SupplierSpec,
  ctx: BuildSheetContext,
): ProducerOrderSheet {
  const missing: string[] = [];

  const styleCode = ctx.mapping.model ?? null;
  if (!styleCode) missing.push(`model: ${spec.baseModelName}`);

  const fabricExternalCode = ctx.mapping.fabric ?? null;
  if (!fabricExternalCode) missing.push(`fabric: ${spec.fabricCode}`);

  const configuration = spec.configuration.map(({ key, value }) => {
    const externalCode = ctx.mapping.options?.[`${key}:${value}`] ?? null;
    if (!externalCode) missing.push(`option ${key}: ${value}`);
    return { label: key, value, externalCode };
  });

  const upgrades = spec.upgrades.map((u) => {
    const externalCode = ctx.mapping.upgrades?.[u.code] ?? null;
    if (!externalCode) missing.push(`upgrade: ${u.code}`);
    return { label: u.code, value: u.placement, externalCode };
  });

  const measurementsCm = spec.measurements.map(({ field, label, value }) => ({
    field,
    label: MEASUREMENT_FIELD_LABELS_EN[field] ?? label,
    value,
  }));

  const labelParts = [
    "Sew in the neutral CUTURA label (no producer branding).",
    spec.label.composition ? `Composition: ${spec.label.composition}` : null,
    spec.label.care ? `Care: ${spec.label.care}` : null,
  ].filter((p): p is string => p !== null);

  return {
    producer: ctx.producer,
    orderNumber: ctx.orderNumber,
    itemRef: ctx.itemRef,
    garmentType: spec.garmentType,
    styleName: spec.baseModelName,
    styleCode,
    fabricCode: spec.fabricCode,
    fabricExternalCode,
    configuration,
    upgrades,
    measurementsCm,
    labelInstruction: labelParts.join(" "),
    missingMappings: missing,
  };
}

/** Canonical, versioned order payload for the (future) Kutetailor API adapter. */
export interface KutetailorOrderPayload {
  version: 1;
  reference: string;
  garmentType: string;
  style: { name: string; code: string };
  fabric: { code: string };
  options: Array<{ name: string; value: string; code: string }>;
  measurementsCm: Record<string, number>;
  remarks: string;
}

export class ProducerMappingError extends Error {
  constructor(missing: string[]) {
    super(`Cannot build the API payload, missing producer codes: ${missing.join("; ")}`);
    this.name = "ProducerMappingError";
  }
}

/**
 * Build the API payload from a sheet. Unlike the manual sheet, the API path has
 * no human to resolve gaps, so any missing mapping is a hard error.
 */
export function buildKutetailorApiPayload(sheet: ProducerOrderSheet): KutetailorOrderPayload {
  if (sheet.missingMappings.length > 0) throw new ProducerMappingError(sheet.missingMappings);
  const measurements: Record<string, number> = {};
  for (const m of sheet.measurementsCm) measurements[m.field] = m.value;
  return {
    version: 1,
    reference: `${sheet.orderNumber}/${sheet.itemRef}`,
    garmentType: sheet.garmentType,
    // The guards above ensure these codes exist.
    style: { name: sheet.styleName, code: sheet.styleCode as string },
    fabric: { code: sheet.fabricExternalCode as string },
    options: [
      ...sheet.configuration.map((c) => ({
        name: c.label,
        value: c.value,
        code: c.externalCode as string,
      })),
      ...sheet.upgrades.map((u) => ({
        name: `upgrade:${u.label}`,
        value: u.value,
        code: u.externalCode as string,
      })),
    ],
    measurementsCm: measurements,
    remarks: sheet.labelInstruction,
  };
}

const NO_CODE = "NO CODE MAPPED";

function codeSuffix(code: string | null): string {
  return code ? ` (${code})` : ` (${NO_CODE})`;
}

/** Plain-English text block the founder copies into the producer portal. */
export function renderProducerOrderSheetText(sheet: ProducerOrderSheet): string {
  const lines: string[] = [];
  lines.push(`Order ${sheet.orderNumber} / ${sheet.itemRef}`);
  lines.push(`Garment: ${sheet.garmentType}`);
  lines.push(
    sheet.styleCode
      ? `Style: ${sheet.styleName} (${sheet.styleCode})`
      : `Style: ${sheet.styleName} (${NO_CODE})`,
  );
  lines.push(
    sheet.fabricExternalCode
      ? `Fabric: ${sheet.fabricExternalCode} (CUTURA ${sheet.fabricCode})`
      : `Fabric: ${NO_CODE} (CUTURA ${sheet.fabricCode})`,
  );
  if (sheet.configuration.length > 0) {
    lines.push("", "Options:");
    for (const c of sheet.configuration)
      lines.push(`- ${c.label}: ${c.value}${codeSuffix(c.externalCode)}`);
  }
  if (sheet.upgrades.length > 0) {
    lines.push("", "Extras:");
    for (const u of sheet.upgrades)
      lines.push(`- ${u.label} (${u.value})${codeSuffix(u.externalCode)}`);
  }
  lines.push("", "Body measurements (cm, no ease applied; pattern and ease by producer):");
  for (const m of sheet.measurementsCm) lines.push(`- ${m.label}: ${m.value} cm`);
  lines.push("", `Label: ${sheet.labelInstruction}`);
  if (sheet.missingMappings.length > 0) {
    lines.push("", "MISSING MAPPINGS (resolve in the portal, then add the codes in the admin):");
    for (const m of sheet.missingMappings) lines.push(`- ${m}`);
  }
  return lines.join("\n");
}
