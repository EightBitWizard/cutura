// The ordered confirmed-measurement fields per garment type, the single source
// the measurement flow (wizard + detailed entry + labels) reads. Adding a garment
// type is data + an estimator module + an entry here - no flow rewrite (FR-104/523).

// Ordered per the supplier's measurement guideline (tuongtailor.com), top-down as
// they are taken on the body; the production spec carries exactly these fields.
const SHIRT_FIELDS = [
  "neck",
  "shoulder",
  "backWidth",
  "aboveChest",
  "chest",
  "armhole",
  "biceps",
  "wrist",
  "sleeveLength",
  "shirtLength",
] as const;

const TROUSER_FIELDS = [
  "waist",
  "belly",
  "hips",
  "crotch",
  "thigh",
  "calf",
  "trouserLength",
] as const;

// Jacket fields per the producer's jacket measuring guide (kutetailor.com blog),
// top-down. Men and women share the field list; the estimation formulas differ.
const JACKET_FIELDS = [
  "chest",
  "waist",
  "hips",
  "shoulder",
  "sleeveLength",
  "backLength",
  "jacketLength",
  "biceps",
  "wrist",
] as const;

/** The customer-entered base inputs the wizard collects; the rest are derived. */
const BASE_INPUTS = ["chest", "waist", "hips"] as const;

/** The ordered confirmed fields for a garment type (unknown types fall back to shirt). */
export function garmentFields(garmentType: string): readonly string[] {
  if (garmentType === "trouser" || garmentType === "trouser_w") return TROUSER_FIELDS;
  if (garmentType === "jacket" || garmentType === "jacket_w") return JACKET_FIELDS;
  return SHIRT_FIELDS;
}

/** The base inputs the wizard asks for, per garment type (chest is dropped for trousers). */
export function wizardBaseFields(garmentType: string): readonly string[] {
  const fields = garmentFields(garmentType);
  return BASE_INPUTS.filter((b) => fields.includes(b));
}
