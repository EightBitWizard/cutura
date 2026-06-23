// Measurement estimator seam. A swappable interface with per-garment-type
// modules (REQUIREMENTS.md E5 US-5.4; FR-521 to FR-524). Estimation runs on the
// server; if a module is missing or fails, the caller falls back to detailed
// manual entry (graceful degradation). The rule-based shirt and trouser modules
// below are ported from the previous build and registered by default. A future
// hosted model, photo, or scan adapter implements the same interface and is
// selected by configuration - this file is the documented place that happens.

import type { ConfidenceLevel, GarmentMeasurements, WizardShortInput } from "./types";

export interface EstimationResult {
  derived: Partial<GarmentMeasurements>;
  confidenceLevel: ConfidenceLevel;
  warnings: string[];
}

export interface MeasurementEstimator {
  readonly garmentType: string;
  estimate(input: WizardShortInput): EstimationResult;
}

export class EstimatorNotFoundError extends Error {
  constructor(garmentType: string) {
    super(`No measurement estimator registered for garment type "${garmentType}".`);
    this.name = "EstimatorNotFoundError";
  }
}

const registry = new Map<string, MeasurementEstimator>();

export function registerEstimator(estimator: MeasurementEstimator): void {
  registry.set(estimator.garmentType, estimator);
}

export function unregisterEstimator(garmentType: string): void {
  registry.delete(garmentType);
}

export function getEstimator(garmentType: string): MeasurementEstimator {
  const estimator = registry.get(garmentType);
  if (!estimator) throw new EstimatorNotFoundError(garmentType);
  return estimator;
}

export function estimate(garmentType: string, input: WizardShortInput): EstimationResult {
  return getEstimator(garmentType).estimate(input);
}

function round(val: number, decimals = 1): number {
  return Math.round(val * 10 ** decimals) / 10 ** decimals;
}

const INVALID_INPUT_WARNING = "Ungültige Eingaben: Grösse und Gewicht müssen positive Werte sein.";
const BODY_REVIEW_HINT =
  "Bei Ihrem Körperbau empfehlen wir, die berechneten Masse besonders sorgfältig zu prüfen.";

export const shirtEstimator: MeasurementEstimator = {
  garmentType: "shirt",
  estimate(input: WizardShortInput): EstimationResult {
    const { heightCm, weightKg, chestCm, waistCm } = input;
    const warnings: string[] = [];

    if (!heightCm || heightCm <= 0 || !weightKg || weightKg <= 0) {
      return { derived: {}, confidenceLevel: "low", warnings: [INVALID_INPUT_WARNING] };
    }

    const bmi = weightKg / (heightCm / 100) ** 2;
    if (bmi < 17 || bmi > 40) {
      warnings.push("Ungewöhnliches Verhältnis von Grösse und Gewicht - bitte Eingaben prüfen.");
    }

    const dropRatio = chestCm - waistCm;
    if (dropRatio < 5 || dropRatio > 30) {
      warnings.push("Ungewöhnliche Differenz zwischen Brust- und Taillenumfang.");
    }

    const neck = round(chestCm * 0.37 + (bmi > 25 ? (bmi - 25) * 0.3 : 0));
    const shoulder = round(heightCm * 0.245 + chestCm * 0.06);
    const sleeveLength = round(heightCm * 0.335);
    const shirtLength = round(heightCm * 0.43);
    const bicepCircumference = round(chestCm * 0.35 + (weightKg - 70) * 0.05);
    const wristCircumference = round(16.5 + (weightKg - 70) * 0.04);

    if (sleeveLength < 55 || sleeveLength > 72) {
      warnings.push(
        `Berechnete Armlänge (${sleeveLength} cm) liegt ausserhalb des Standardbereichs - Ihre Bestellung wird zur Prüfung weitergeleitet.`,
      );
    }
    if (shirtLength < 68 || shirtLength > 90) {
      warnings.push(
        `Berechnete Hemdlänge (${shirtLength} cm) liegt ausserhalb des Standardbereichs - Ihre Bestellung wird zur Prüfung weitergeleitet.`,
      );
    }

    let confidenceLevel: ConfidenceLevel = "high";
    if (warnings.length > 0) {
      confidenceLevel = "low";
    } else if (bmi > 28 || bmi < 19) {
      confidenceLevel = "medium";
      warnings.push(BODY_REVIEW_HINT);
    }

    return {
      derived: {
        neck,
        shoulder,
        sleeveLength,
        shirtLength,
        bicepCircumference,
        wristCircumference,
      },
      confidenceLevel,
      warnings,
    };
  },
};

export const trouserEstimator: MeasurementEstimator = {
  garmentType: "trouser",
  estimate(input: WizardShortInput): EstimationResult {
    const { heightCm, weightKg, waistCm, hipsCm, fitPreference } = input;
    const warnings: string[] = [];

    if (!heightCm || heightCm <= 0 || !weightKg || weightKg <= 0) {
      return { derived: {}, confidenceLevel: "low", warnings: [INVALID_INPUT_WARNING] };
    }

    const bmi = weightKg / (heightCm / 100) ** 2;
    if (bmi < 17 || bmi > 40) {
      warnings.push("Ungewöhnliches Verhältnis von Grösse und Gewicht - bitte Eingaben prüfen.");
    }
    if (waistCm && hipsCm && waistCm - hipsCm > 10) {
      warnings.push("Ungewöhnliche Differenz zwischen Taille und Hüfte - bitte Eingaben prüfen.");
    }

    // Inseam: ~46% of height, with a mild downward adjustment for heavier builds
    // where the worn waist sits higher.
    const inseam = round(heightCm * 0.46 - (bmi > 28 ? (bmi - 28) * 0.2 : 0));
    // Rise scales with height plus a small lift for heavier builds.
    const rise = round(heightCm * 0.155 + (bmi > 25 ? (bmi - 25) * 0.25 : 0));
    const outseam = round(inseam + rise);
    const thigh = round(waistCm * 0.58 + (weightKg - 70) * 0.18);
    const knee = round(thigh * 0.72);
    const legOpeningFactor =
      fitPreference === "slim" ? 0.46 : fitPreference === "relaxed" ? 0.62 : 0.54;
    const legOpening = round(thigh * legOpeningFactor);

    if (inseam < 60 || inseam > 95) {
      warnings.push(
        `Berechnete Schrittlänge (${inseam} cm) liegt ausserhalb des Standardbereichs - Ihre Bestellung wird zur Prüfung weitergeleitet.`,
      );
    }
    if (outseam < 80 || outseam > 120) {
      warnings.push(
        `Berechnete Aussenlänge (${outseam} cm) liegt ausserhalb des Standardbereichs - Ihre Bestellung wird zur Prüfung weitergeleitet.`,
      );
    }

    let confidenceLevel: ConfidenceLevel = "high";
    if (warnings.length > 0) {
      confidenceLevel = "low";
    } else if (bmi > 28 || bmi < 19) {
      confidenceLevel = "medium";
      warnings.push(BODY_REVIEW_HINT);
    }

    return {
      derived: { inseam, outseam, thigh, knee, legOpening, rise },
      confidenceLevel,
      warnings,
    };
  },
};

registerEstimator(shirtEstimator);
registerEstimator(trouserEstimator);
