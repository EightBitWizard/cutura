// Shared domain types for the made-to-measure core. Pure declarations, no
// runtime. Ported from the previous build's packages/shared and kept framework
// free. The catalog, pricing, and snapshot types live with their modules.

export type MeasurementMethod = "detailed" | "wizard";

/** Garment type key. Garment types are data-driven; "shirt" and "trouser" ship at launch. */
export type GarmentType = "shirt" | "trouser";

export type FitPreference = "slim" | "regular" | "relaxed";

export type ConfidenceLevel = "high" | "medium" | "low";

// Field sets follow the supplier's measurement guideline (tuongtailor.com), so the
// spec the tailor receives contains exactly the measurements he works with. All cm.
export interface ShirtMeasurements {
  neck: number;
  shoulder: number;
  backWidth: number;
  aboveChest: number;
  chest: number;
  armhole: number;
  biceps: number;
  wrist: number;
  sleeveLength: number;
  shirtLength: number;
}

export interface TrouserMeasurements {
  waist: number;
  belly: number;
  hips: number;
  crotch: number;
  thigh: number;
  calf: number;
  trouserLength: number;
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
