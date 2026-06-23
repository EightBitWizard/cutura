// Shared domain types for the made-to-measure core. Pure declarations, no
// runtime. Ported from the previous build's packages/shared and kept framework
// free. The catalog, pricing, and snapshot types live with their modules.

export type MeasurementMethod = "detailed" | "wizard";

/** Garment type key. Garment types are data-driven; "shirt" and "trouser" ship at launch. */
export type GarmentType = "shirt" | "trouser";

export type FitPreference = "slim" | "regular" | "relaxed";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface ShirtMeasurements {
  // Core (always required), centimetres
  chest: number;
  waist: number;
  hips: number;
  neck: number;
  shoulder: number;
  sleeveLength: number;
  shirtLength: number;
  // Detail (required for detailed entry, derived in the wizard)
  chest_extra?: number;
  wristCircumference?: number;
  bicepCircumference?: number;
}

export interface TrouserMeasurements {
  waist: number;
  hips: number;
  inseam: number;
  outseam: number;
  thigh: number;
  knee?: number;
  legOpening?: number;
  rise?: number;
}

export type GarmentMeasurements = ShirtMeasurements | TrouserMeasurements;

/** Short wizard input from which the estimator derives a full measurement set. */
export interface WizardShortInput {
  heightCm: number;
  weightKg: number;
  chestCm: number;
  waistCm: number;
  hipsCm: number;
  fitPreference: FitPreference;
}

export interface OutlierCheck {
  isOutlier: boolean;
  flags: string[];
}
