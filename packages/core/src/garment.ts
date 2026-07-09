// Garment-type inference and short German field labels. Ported from the previous
// build. inferGarmentType is used by code paths that read a stored measurement
// snapshot without an explicit garment type; the labels suit admin tables where
// space is tight (the bilingual supplier-spec labels live with the supplier
// spec, added in a later milestone).

import type { GarmentType } from "./types";

export const GARMENT_TYPES: readonly GarmentType[] = [
  "shirt",
  "trouser",
  "jacket",
  "jacket_w",
  "trouser_w",
];

/**
 * Normalize an untrusted garment-type value (query param, request body) to a
 * known key. Unknown values fall back to "shirt" (the historic default), so a
 * bad input degrades to a working flow instead of an error page.
 */
export function normalizeGarmentType(value: unknown): GarmentType {
  return GARMENT_TYPES.includes(value as GarmentType) ? (value as GarmentType) : "shirt";
}

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
  // Jacket-only keys (men's cut as the historic fallback; the women's cuts share
  // field sets and are only distinguishable via the explicit version garmentType).
  if ("jacketLength" in measurements || "backLength" in measurements) return "jacket";
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
  // Jackets (producer guideline)
  backLength: "Rückenlänge",
  jacketLength: "Sakkolänge",
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
  // Jackets (producer guideline)
  backLength: "Back length",
  jacketLength: "Jacket length",
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
