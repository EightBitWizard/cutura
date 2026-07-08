// Garment-type inference and short German field labels. Ported from the previous
// build. inferGarmentType is used by code paths that read a stored measurement
// snapshot without an explicit garment type; the labels suit admin tables where
// space is tight (the bilingual supplier-spec labels live with the supplier
// spec, added in a later milestone).

import type { GarmentType } from "./types";

// Current supplier-guideline keys first; the historic keys stay so snapshots
// written before the field-set change (remakes, admin views) still infer correctly.
const TROUSER_ONLY_KEYS = [
  "belly",
  "crotch",
  "calf",
  "trouserLength",
  "inseam",
  "outseam",
  "rise",
  "knee",
  "legOpening",
] as const;

/**
 * Infer the garment type from a partial measurement object, keyed on
 * trouser-only fields. Any shape lacking them is treated as a shirt, matching
 * the historic default.
 */
export function inferGarmentType(
  measurements: Record<string, unknown> | null | undefined,
): GarmentType {
  if (!measurements) return "shirt";
  for (const key of TROUSER_ONLY_KEYS) {
    if (key in measurements) return "trouser";
  }
  return "shirt";
}

export const MEASUREMENT_FIELD_LABELS_DE: Record<string, string> = {
  // Shirts (supplier guideline)
  chest: "Brustumfang",
  aboveChest: "Oberbrustumfang",
  backWidth: "Rückenbreite",
  armhole: "Armlochumfang",
  neck: "Halsumfang",
  shoulder: "Schulterbreite",
  sleeveLength: "Armlänge",
  shirtLength: "Hemdlänge",
  biceps: "Oberarmumfang",
  wrist: "Handgelenkumfang",
  // Historic shirt keys (pre-guideline snapshots)
  bicepCircumference: "Oberarmumfang",
  wristCircumference: "Handgelenkumfang",
  // Shared
  waist: "Taillenumfang",
  hips: "Hüftumfang",
  // Trousers (supplier guideline)
  belly: "Bauchumfang",
  crotch: "Schrittbogen",
  calf: "Wadenumfang",
  trouserLength: "Hosenlänge",
  // Historic trouser keys (pre-guideline snapshots)
  inseam: "Schrittlänge",
  outseam: "Aussenlänge",
  thigh: "Oberschenkelumfang",
  knee: "Knieumfang",
  legOpening: "Beinöffnung",
  rise: "Schritttiefe",
};

/** English field labels for producer-facing documents (portals operate in English). */
export const MEASUREMENT_FIELD_LABELS_EN: Record<string, string> = {
  // Shirts (supplier guideline)
  chest: "Chest",
  aboveChest: "Above chest",
  backWidth: "Back width",
  armhole: "Armhole",
  neck: "Neck",
  shoulder: "Shoulder width",
  sleeveLength: "Sleeve length",
  shirtLength: "Shirt length",
  biceps: "Biceps",
  wrist: "Wrist",
  // Historic shirt keys (pre-guideline snapshots)
  bicepCircumference: "Biceps",
  wristCircumference: "Wrist",
  // Shared
  waist: "Waist",
  hips: "Hips",
  // Trousers (supplier guideline)
  belly: "Belly",
  crotch: "Crotch length",
  calf: "Calf",
  trouserLength: "Trouser length",
  // Historic trouser keys (pre-guideline snapshots)
  inseam: "Inseam",
  outseam: "Outseam",
  thigh: "Thigh",
  knee: "Knee",
  legOpening: "Leg opening",
  rise: "Rise",
};
