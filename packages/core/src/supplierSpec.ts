// Build a standardized supplier specification from an order snapshot (FR-860).
// Pure: turns the frozen snapshot into an ordered, labelled spec (measurements,
// configuration, upgrades, fabric) that the PDF renderer + supplier email format.
// Image R2 keys are passed in by the caller (resolved from the published model),
// since the snapshot stores codes, not media ids.

import { MEASUREMENT_FIELD_LABELS_DE } from "./garment";
import { formatCHF } from "./money";
import type { OrderSnapshot } from "./snapshot";

export interface SupplierSpecImage {
  r2Key: string;
  caption: string;
}

export interface SupplierSpec {
  garmentType: string;
  baseModelName: string;
  fabricCode: string;
  configuration: Array<{ key: string; value: string }>;
  upgrades: Array<{ code: string; placement: string; price: string }>;
  measurements: Array<{ field: string; label: string; value: number }>;
  images: SupplierSpecImage[];
}

export interface BuildSupplierSpecOptions {
  images?: SupplierSpecImage[];
  /** Field-label map (supplier-facing); defaults to the German labels. */
  fieldLabels?: Record<string, string>;
}

export function buildSupplierSpec(
  snapshot: OrderSnapshot,
  opts: BuildSupplierSpecOptions = {},
): SupplierSpec {
  const labels = opts.fieldLabels ?? MEASUREMENT_FIELD_LABELS_DE;
  const measurements = Object.entries(
    snapshot.effectiveMeasurements as unknown as Record<string, unknown>,
  )
    .filter(([, v]) => typeof v === "number")
    .map(([field, value]) => ({ field, label: labels[field] ?? field, value: value as number }));
  return {
    garmentType: snapshot.garmentType,
    baseModelName: snapshot.baseModelName,
    fabricCode: snapshot.fabricCode,
    configuration: Object.entries(snapshot.configuration).map(([key, value]) => ({ key, value })),
    upgrades: snapshot.upgrades.map((u) => ({
      code: u.code,
      placement: u.placement ?? "-",
      price: formatCHF(u.priceMinor),
    })),
    measurements,
    images: opts.images ?? [],
  };
}
