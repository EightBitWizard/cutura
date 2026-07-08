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
    const { heightCm, weightKg, chestCm } = input;
    const warnings: string[] = [];

    if (!heightCm || heightCm <= 0 || !weightKg || weightKg <= 0) {
      return { derived: {}, confidenceLevel: "low", warnings: [INVALID_INPUT_WARNING] };
    }

    const bmi = weightKg / (heightCm / 100) ** 2;
    if (bmi < 17 || bmi > 40) {
      warnings.push("Ungewöhnliches Verhältnis von Grösse und Gewicht - bitte Eingaben prüfen.");
    }

    // Derivations for the supplier's shirt field set (chest itself is the wizard input).
    const neck = round(chestCm * 0.37 + (bmi > 25 ? (bmi - 25) * 0.3 : 0));
    const shoulder = round(heightCm * 0.245 + chestCm * 0.06);
    const backWidth = round(chestCm * 0.44);
    const aboveChest = round(chestCm - 4);
    const armhole = round(chestCm * 0.46 + (bmi > 25 ? (bmi - 25) * 0.2 : 0));
    const biceps = round(chestCm * 0.35 + (weightKg - 70) * 0.05);
    const wrist = round(16.5 + (weightKg - 70) * 0.04);
    const sleeveLength = round(heightCm * 0.335);
    const shirtLength = round(heightCm * 0.43);

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
        backWidth,
        aboveChest,
        armhole,
        biceps,
        wrist,
        sleeveLength,
        shirtLength,
      },
      confidenceLevel,
      warnings,
    };
  },
};

export const trouserEstimator: MeasurementEstimator = {
  garmentType: "trouser",
  estimate(input: WizardShortInput): EstimationResult {
    const { heightCm, weightKg, waistCm, hipsCm } = input;
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

    // Derivations for the supplier's trouser field set (waist + hips are wizard inputs).
    // Trouser length runs from the worn waist to the top of the shoe (the supplier's
    // "pant length"), i.e. the historic inseam + rise share of height.
    const belly = round(waistCm + 2 + (bmi > 24 ? (bmi - 24) * 0.8 : 0));
    const crotch = round(heightCm * 0.36 + (bmi > 25 ? (bmi - 25) * 0.4 : 0));
    const thigh = round(waistCm * 0.58 + (weightKg - 70) * 0.18);
    const calf = round(thigh * 0.65);
    const trouserLength = round(heightCm * 0.615 - (bmi > 28 ? (bmi - 28) * 0.2 : 0));

    if (trouserLength < 80 || trouserLength > 125) {
      warnings.push(
        `Berechnete Hosenlänge (${trouserLength} cm) liegt ausserhalb des Standardbereichs - Ihre Bestellung wird zur Prüfung weitergeleitet.`,
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
      derived: { belly, crotch, thigh, calf, trouserLength },
      confidenceLevel,
      warnings,
    };
  },
};

export const jacketEstimator: MeasurementEstimator = {
  garmentType: "jacket",
  estimate(input: WizardShortInput): EstimationResult {
    const { heightCm, weightKg, chestCm } = input;
    const warnings: string[] = [];

    if (!heightCm || heightCm <= 0 || !weightKg || weightKg <= 0) {
      return { derived: {}, confidenceLevel: "low", warnings: [INVALID_INPUT_WARNING] };
    }

    const bmi = weightKg / (heightCm / 100) ** 2;
    if (bmi < 17 || bmi > 40) {
      warnings.push("Ungewöhnliches Verhältnis von Grösse und Gewicht - bitte Eingaben prüfen.");
    }

    // Jacket derivations (producer guideline fields; chest/waist/hips are wizard
    // inputs). Back length = nape to waistline, jacket length = nape to thigh;
    // both scale with height per standard menswear pattern proportions.
    const shoulder = round(heightCm * 0.245 + chestCm * 0.06);
    const sleeveLength = round(heightCm * 0.335);
    const backLength = round(heightCm * 0.25);
    const jacketLength = round(heightCm * 0.415);
    const biceps = round(chestCm * 0.35 + (weightKg - 70) * 0.05);
    const wrist = round(16.5 + (weightKg - 70) * 0.04);

    if (jacketLength < 50 || jacketLength > 95) {
      warnings.push(
        `Berechnete Sakkolänge (${jacketLength} cm) liegt ausserhalb des Standardbereichs - Ihre Bestellung wird zur Prüfung weitergeleitet.`,
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
      derived: { shoulder, sleeveLength, backLength, jacketLength, biceps, wrist },
      confidenceLevel,
      warnings,
    };
  },
};

// Women's modules derive from standard female pattern-drafting proportions
// (nape-to-waist ~ height * 0.235, narrower shoulder-to-height ratio, thigh
// correlating with hips). PROVISIONAL until the producer confirms its women's
// measuring guideline; wide outlier bounds plus the founder review gate catch
// implausible results, and detailed manual entry always remains available.
export const jacketWomenEstimator: MeasurementEstimator = {
  garmentType: "jacket_w",
  estimate(input: WizardShortInput): EstimationResult {
    const { heightCm, weightKg, chestCm } = input;
    const warnings: string[] = [];

    if (!heightCm || heightCm <= 0 || !weightKg || weightKg <= 0) {
      return { derived: {}, confidenceLevel: "low", warnings: [INVALID_INPUT_WARNING] };
    }

    const bmi = weightKg / (heightCm / 100) ** 2;
    if (bmi < 16 || bmi > 40) {
      warnings.push("Ungewöhnliches Verhältnis von Grösse und Gewicht - bitte Eingaben prüfen.");
    }

    const shoulder = round(heightCm * 0.22 + chestCm * 0.045);
    const sleeveLength = round(heightCm * 0.33);
    const backLength = round(heightCm * 0.235);
    const jacketLength = round(heightCm * 0.38);
    const biceps = round(chestCm * 0.3 + (weightKg - 60) * 0.05);
    const wrist = round(15 + (weightKg - 60) * 0.04);

    if (jacketLength < 50 || jacketLength > 95) {
      warnings.push(
        `Berechnete Sakkolänge (${jacketLength} cm) liegt ausserhalb des Standardbereichs - Ihre Bestellung wird zur Prüfung weitergeleitet.`,
      );
    }

    let confidenceLevel: ConfidenceLevel = "high";
    if (warnings.length > 0) {
      confidenceLevel = "low";
    } else if (bmi > 28 || bmi < 18) {
      confidenceLevel = "medium";
      warnings.push(BODY_REVIEW_HINT);
    }

    return {
      derived: { shoulder, sleeveLength, backLength, jacketLength, biceps, wrist },
      confidenceLevel,
      warnings,
    };
  },
};

export const trouserWomenEstimator: MeasurementEstimator = {
  garmentType: "trouser_w",
  estimate(input: WizardShortInput): EstimationResult {
    const { heightCm, weightKg, waistCm, hipsCm } = input;
    const warnings: string[] = [];

    if (!heightCm || heightCm <= 0 || !weightKg || weightKg <= 0) {
      return { derived: {}, confidenceLevel: "low", warnings: [INVALID_INPUT_WARNING] };
    }

    const bmi = weightKg / (heightCm / 100) ** 2;
    if (bmi < 16 || bmi > 40) {
      warnings.push("Ungewöhnliches Verhältnis von Grösse und Gewicht - bitte Eingaben prüfen.");
    }

    // Female proportions: thigh follows hips more closely than waist; the crotch
    // arc sits slightly longer relative to height than the male module.
    const belly = round(waistCm + 1 + (bmi > 24 ? (bmi - 24) * 0.8 : 0));
    const crotch = round(heightCm * 0.37 + (bmi > 25 ? (bmi - 25) * 0.4 : 0));
    const thigh = round(hipsCm * 0.58 + (weightKg - 60) * 0.1);
    const calf = round(thigh * 0.63);
    const trouserLength = round(heightCm * 0.62 - (bmi > 28 ? (bmi - 28) * 0.2 : 0));

    if (trouserLength < 80 || trouserLength > 125) {
      warnings.push(
        `Berechnete Hosenlänge (${trouserLength} cm) liegt ausserhalb des Standardbereichs - Ihre Bestellung wird zur Prüfung weitergeleitet.`,
      );
    }

    let confidenceLevel: ConfidenceLevel = "high";
    if (warnings.length > 0) {
      confidenceLevel = "low";
    } else if (bmi > 28 || bmi < 18) {
      confidenceLevel = "medium";
      warnings.push(BODY_REVIEW_HINT);
    }

    return {
      derived: { belly, crotch, thigh, calf, trouserLength },
      confidenceLevel,
      warnings,
    };
  },
};

registerEstimator(shirtEstimator);
registerEstimator(trouserEstimator);
registerEstimator(jacketEstimator);
registerEstimator(jacketWomenEstimator);
registerEstimator(trouserWomenEstimator);
