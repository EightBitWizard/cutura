// Plausibility and outlier detection on confirmed measurements. Pure functions,
// ported from the previous build (packages/shared). They drive the review gate:
// any flag routes the order to internal review before production
// (REQUIREMENTS.md E5 US-5.7, US-5.8; FR-550, FR-551, FR-560).
//
// German operator-facing strings only; all dashes are ASCII hyphens per the
// CLAUDE.md style rule.

import type {
  GarmentMeasurements,
  OutlierCheck,
  ShirtMeasurements,
  TrouserMeasurements,
} from "./types";

/**
 * A field counts as provided when it is a finite number, including 0. A truthy
 * guard would skip 0, letting a cleared input (Number("") === 0) bypass every
 * range check; range checks must flag impossible zero values instead.
 */
function isNum(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function checkShirtOutliers(
  measurements: Partial<ShirtMeasurements> | null | undefined,
): OutlierCheck {
  const flags: string[] = [];

  if (!measurements || Object.keys(measurements).length === 0) {
    return { isOutlier: true, flags: ["Keine Masse vorhanden - manuelle Prüfung erforderlich."] };
  }

  const {
    neck,
    shoulder,
    backWidth,
    aboveChest,
    chest,
    armhole,
    biceps,
    wrist,
    sleeveLength,
    shirtLength,
  } = measurements;

  if (isNum(chest) && (chest < 70 || chest > 160)) {
    flags.push("Brustumfang liegt ausserhalb des üblichen Bereichs (70-160 cm).");
  }
  if (isNum(neck) && (neck < 30 || neck > 60)) {
    flags.push("Halsumfang liegt ausserhalb des üblichen Bereichs (30-60 cm).");
  }
  if (isNum(aboveChest) && (aboveChest < 65 || aboveChest > 155)) {
    flags.push("Oberbrustumfang liegt ausserhalb des üblichen Bereichs (65-155 cm).");
  }
  if (isNum(aboveChest) && isNum(chest) && aboveChest > chest + 3) {
    flags.push("Oberbrustumfang deutlich grösser als Brustumfang - bitte prüfen.");
  }
  if (isNum(backWidth) && (backWidth < 30 || backWidth > 60)) {
    flags.push("Rückenbreite liegt ausserhalb des üblichen Bereichs (30-60 cm).");
  }
  if (isNum(armhole) && (armhole < 30 || armhole > 65)) {
    flags.push("Armlochumfang liegt ausserhalb des üblichen Bereichs (30-65 cm).");
  }
  if (isNum(biceps) && (biceps < 20 || biceps > 55)) {
    flags.push("Oberarmumfang liegt ausserhalb des üblichen Bereichs (20-55 cm).");
  }
  if (isNum(wrist) && (wrist < 12 || wrist > 25)) {
    flags.push("Handgelenkumfang liegt ausserhalb des üblichen Bereichs (12-25 cm).");
  }

  if (isNum(chest) && chest > 0 && isNum(neck)) {
    const ratio = neck / chest;
    if (ratio < 0.3 || ratio > 0.45) {
      flags.push("Halsumfang scheint im Verhältnis zum Brustumfang ungewöhnlich.");
    }
  }

  if (isNum(shoulder)) {
    if (isNum(chest) && shoulder > chest / 2 + 5) {
      flags.push("Schulterbreite scheint sehr gross - bitte prüfen.");
    }
    if (shoulder < 30) flags.push("Schulterbreite unter 30 cm ist sehr klein - bitte prüfen.");
  }

  if (isNum(sleeveLength) && (sleeveLength < 55 || sleeveLength > 72)) {
    flags.push("Armlänge liegt ausserhalb des üblichen Bereichs (55-72 cm).");
  }

  if (isNum(shirtLength) && (shirtLength < 68 || shirtLength > 90)) {
    flags.push("Hemdlänge liegt ausserhalb des üblichen Bereichs (68-90 cm).");
  }

  return { isOutlier: flags.length > 0, flags };
}

/** Dispatch the outlier check by garment type (used to surface review/outlier orders in the admin). */
export function checkOutliers(
  garmentType: string,
  measurements: GarmentMeasurements | null | undefined,
): OutlierCheck {
  if (garmentType === "trouser") {
    return checkTrouserOutliers(measurements as Partial<TrouserMeasurements> | null | undefined);
  }
  return checkShirtOutliers(measurements as Partial<ShirtMeasurements> | null | undefined);
}

export function checkTrouserOutliers(
  measurements: Partial<TrouserMeasurements> | null | undefined,
): OutlierCheck {
  const flags: string[] = [];

  if (!measurements || Object.keys(measurements).length === 0) {
    return { isOutlier: true, flags: ["Keine Masse vorhanden - manuelle Prüfung erforderlich."] };
  }

  const { waist, belly, hips, crotch, thigh, calf, trouserLength } = measurements;

  if (isNum(waist) && isNum(hips) && waist - hips > 10) {
    flags.push("Taillenumfang deutlich grösser als Hüftumfang - bitte prüfen.");
  }

  if (isNum(waist) && (waist < 55 || waist > 150)) {
    flags.push("Taillenumfang liegt ausserhalb des üblichen Bereichs (55-150 cm).");
  }
  if (isNum(belly) && (belly < 55 || belly > 160)) {
    flags.push("Bauchumfang liegt ausserhalb des üblichen Bereichs (55-160 cm).");
  }
  if (isNum(hips) && (hips < 70 || hips > 160)) {
    flags.push("Hüftumfang liegt ausserhalb des üblichen Bereichs (70-160 cm).");
  }

  if (isNum(crotch) && (crotch < 45 || crotch > 90)) {
    flags.push("Schrittbogen liegt ausserhalb des üblichen Bereichs (45-90 cm).");
  }
  if (isNum(trouserLength) && (trouserLength < 80 || trouserLength > 125)) {
    flags.push("Hosenlänge liegt ausserhalb des üblichen Bereichs (80-125 cm).");
  }
  if (isNum(crotch) && isNum(trouserLength) && crotch >= trouserLength) {
    flags.push("Hosenlänge muss grösser als der Schrittbogen sein - bitte prüfen.");
  }

  if (isNum(thigh) && (thigh < 40 || thigh > 85)) {
    flags.push("Oberschenkelumfang liegt ausserhalb des üblichen Bereichs (40-85 cm).");
  }
  if (isNum(thigh) && isNum(calf) && calf > thigh) {
    flags.push("Wadenumfang grösser als Oberschenkelumfang - bitte prüfen.");
  }
  if (isNum(calf) && (calf < 25 || calf > 60)) {
    flags.push("Wadenumfang liegt ausserhalb des üblichen Bereichs (25-60 cm).");
  }

  return { isOutlier: flags.length > 0, flags };
}
