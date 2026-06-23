// Garment-type inference and short German field labels. Ported from the previous
// build. inferGarmentType is used by code paths that read a stored measurement
// snapshot without an explicit garment type; the labels suit admin tables where
// space is tight (the bilingual supplier-spec labels live with the supplier
// spec, added in a later milestone).

import type { GarmentType } from "./types";

const TROUSER_ONLY_KEYS = ["inseam", "outseam", "thigh", "rise", "knee", "legOpening"] as const;

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
  // Shirts
  chest: "Brustumfang",
  neck: "Halsumfang",
  shoulder: "Schulterbreite",
  sleeveLength: "Armlänge",
  shirtLength: "Hemdlänge",
  bicepCircumference: "Oberarmumfang",
  wristCircumference: "Handgelenkumfang",
  // Shared
  waist: "Taillenumfang",
  hips: "Hüftumfang",
  // Trousers
  inseam: "Schrittlänge",
  outseam: "Aussenlänge",
  thigh: "Oberschenkelumfang",
  knee: "Knieumfang",
  legOpening: "Beinöffnung",
  rise: "Schritttiefe",
};
