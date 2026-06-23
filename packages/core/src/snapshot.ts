// Order snapshot builder. Freezes the effective values (the confirmed profile
// measurements plus any per-piece override) together with the configuration,
// upgrades, and computed price into an immutable production package, written
// once at purchase and never updated. The per-piece override adjusts specific
// fields for this garment only and never changes the profile. See
// REQUIREMENTS.md E5 (US-5.11; FR-590 to FR-592) and E8 (US-8.2; FR-810,
// FR-811), plus the CLAUDE.md immutability invariant.

import type { PriceBreakdown } from "./pricing";
import type { GarmentMeasurements, MeasurementMethod } from "./types";

/** Per-field measurement deltas in centimetres, applied to this garment only. */
export type PerPieceOverride = Record<string, number>;

export interface SnapshotUpgrade {
  code: string;
  placement?: string;
  priceMinor: number;
}

export interface OrderSnapshot {
  baseModelName: string;
  fabricCode: string;
  configuration: Record<string, string>;
  upgrades: SnapshotUpgrade[];
  garmentType: string;
  measurementMethod: MeasurementMethod;
  measurementProfileVersion: number;
  effectiveMeasurements: GarmentMeasurements;
  price: PriceBreakdown;
  createdAt: string;
}

export interface BuildSnapshotInput {
  baseModelName: string;
  fabricCode: string;
  configuration: Record<string, string>;
  upgrades: SnapshotUpgrade[];
  garmentType: string;
  measurementMethod: MeasurementMethod;
  measurementProfileVersion: number;
  confirmedValues: GarmentMeasurements;
  override?: PerPieceOverride;
  price: PriceBreakdown;
  createdAt: string;
}

/**
 * Apply a per-piece override to confirmed measurements. Returns a new object;
 * the source profile measurements are never mutated. Only known numeric fields
 * are adjusted; unknown override keys are ignored.
 */
export function applyOverride(
  confirmed: GarmentMeasurements,
  override?: PerPieceOverride,
): GarmentMeasurements {
  const result: Record<string, number> = { ...(confirmed as unknown as Record<string, number>) };
  if (override) {
    for (const [field, delta] of Object.entries(override)) {
      if (typeof result[field] === "number") {
        result[field] += delta;
      }
    }
  }
  return result as unknown as GarmentMeasurements;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) {
      deepFreeze(v);
    }
    Object.freeze(value);
  }
  return value;
}

export function buildOrderSnapshot(input: BuildSnapshotInput): Readonly<OrderSnapshot> {
  const snapshot: OrderSnapshot = {
    baseModelName: input.baseModelName,
    fabricCode: input.fabricCode,
    configuration: { ...input.configuration },
    upgrades: input.upgrades.map((u) => ({ ...u })),
    garmentType: input.garmentType,
    measurementMethod: input.measurementMethod,
    measurementProfileVersion: input.measurementProfileVersion,
    effectiveMeasurements: applyOverride(input.confirmedValues, input.override),
    price: { ...input.price },
    createdAt: input.createdAt,
  };
  return deepFreeze(snapshot);
}
