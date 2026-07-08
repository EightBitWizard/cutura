// Shared domain types for the made-to-measure core. Pure declarations, no
// runtime. Ported from the previous build's packages/shared and kept framework
// free. The catalog, pricing, and snapshot types live with their modules.

export type MeasurementMethod = "detailed" | "wizard";

/**
 * Garment type key. Garment types are data-driven; shirts and trousers shipped
 * first, jackets (men + women) and women's trousers join for the suit program.
 * Women's cuts are separate keys (not a flag) so field sets, estimators, outlier
 * ranges, and QC templates stay independently swappable per cut.
 */
export type GarmentType = "shirt" | "trouser" | "jacket" | "jacket_w" | "trouser_w";

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

// Jacket fields per the producer's jacket measuring guide; men's and women's
// cuts share the field list (formulas and plausibility differ per cut).
export interface JacketMeasurements {
  chest: number;
  waist: number;
  hips: number;
  shoulder: number;
  sleeveLength: number;
  backLength: number;
  jacketLength: number;
  biceps: number;
  wrist: number;
}

export type GarmentMeasurements = ShirtMeasurements | TrouserMeasurements | JacketMeasurements;

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
