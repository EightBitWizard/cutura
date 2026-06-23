// Plausibility and outlier detection on confirmed measurements. Pure functions,
// ported from the previous build (packages/shared). They drive the review gate:
// any flag routes the order to internal review before production
// (REQUIREMENTS.md E5 US-5.7, US-5.8; FR-550, FR-551, FR-560).
//
// German operator-facing strings only; all dashes are ASCII hyphens per the
// CLAUDE.md style rule.

import type { OutlierCheck, ShirtMeasurements, TrouserMeasurements } from "./types";

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

  const { chest, waist, neck, shoulder, sleeveLength, shirtLength } = measurements;

  if (isNum(chest) && (chest < 70 || chest > 160)) {
    flags.push("Brustumfang liegt ausserhalb des üblichen Bereichs (70-160 cm).");
  }
  if (isNum(waist) && (waist < 50 || waist > 150)) {
    flags.push("Taillenumfang liegt ausserhalb des üblichen Bereichs (50-150 cm).");
  }
  if (isNum(neck) && (neck < 30 || neck > 60)) {
    flags.push("Halsumfang liegt ausserhalb des üblichen Bereichs (30-60 cm).");
  }

  if (isNum(chest) && isNum(waist)) {
    if (waist > chest) flags.push("Taillenumfang grösser als Brustumfang - bitte prüfen.");
    if (chest - waist > 30) {
      flags.push("Sehr grosse Taille-Brust-Differenz (>30 cm) - bitte prüfen.");
    }
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

export function checkTrouserOutliers(
  measurements: Partial<TrouserMeasurements> | null | undefined,
): OutlierCheck {
  const flags: string[] = [];

  if (!measurements || Object.keys(measurements).length === 0) {
    return { isOutlier: true, flags: ["Keine Masse vorhanden - manuelle Prüfung erforderlich."] };
  }

  const { waist, hips, inseam, outseam, thigh, knee, legOpening, rise } = measurements;

  if (isNum(waist) && isNum(hips) && waist - hips > 10) {
    flags.push("Taillenumfang deutlich grösser als Hüftumfang - bitte prüfen.");
  }

  if (isNum(waist) && (waist < 55 || waist > 150)) {
    flags.push("Taillenumfang liegt ausserhalb des üblichen Bereichs (55-150 cm).");
  }
  if (isNum(hips) && (hips < 70 || hips > 160)) {
    flags.push("Hüftumfang liegt ausserhalb des üblichen Bereichs (70-160 cm).");
  }

  if (isNum(inseam) && (inseam < 60 || inseam > 95)) {
    flags.push("Schrittlänge liegt ausserhalb des üblichen Bereichs (60-95 cm).");
  }
  if (isNum(outseam) && (outseam < 80 || outseam > 120)) {
    flags.push("Aussenlänge liegt ausserhalb des üblichen Bereichs (80-120 cm).");
  }
  if (isNum(inseam) && isNum(outseam) && outseam <= inseam) {
    flags.push("Aussenlänge muss grösser als Schrittlänge sein - bitte prüfen.");
  }

  if (isNum(thigh) && (thigh < 40 || thigh > 85)) {
    flags.push("Oberschenkelumfang liegt ausserhalb des üblichen Bereichs (40-85 cm).");
  }
  if (isNum(thigh) && isNum(knee) && knee > thigh) {
    flags.push("Knieumfang grösser als Oberschenkelumfang - bitte prüfen.");
  }
  if (isNum(thigh) && isNum(legOpening) && legOpening > thigh) {
    flags.push("Beinöffnung grösser als Oberschenkelumfang - bitte prüfen.");
  }
  if (isNum(legOpening) && (legOpening < 16 || legOpening > 50)) {
    flags.push("Beinöffnung liegt ausserhalb des üblichen Bereichs (16-50 cm).");
  }
  if (isNum(rise) && (rise < 18 || rise > 38)) {
    flags.push("Schritttiefe liegt ausserhalb des üblichen Bereichs (18-38 cm).");
  }

  return { isOutlier: flags.length > 0, flags };
}
