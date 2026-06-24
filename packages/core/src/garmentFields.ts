// The ordered confirmed-measurement fields per garment type, the single source
// the measurement flow (wizard + detailed entry + labels) reads. Adding a garment
// type is data + an estimator module + an entry here - no flow rewrite (FR-104/523).

const SHIRT_FIELDS = [
  "chest",
  "waist",
  "hips",
  "neck",
  "shoulder",
  "sleeveLength",
  "shirtLength",
] as const;

const TROUSER_FIELDS = [
  "waist",
  "hips",
  "inseam",
  "outseam",
  "thigh",
  "knee",
  "legOpening",
  "rise",
] as const;

/** The customer-entered base inputs the wizard collects; the rest are derived. */
const BASE_INPUTS = ["chest", "waist", "hips"] as const;

/** The ordered confirmed fields for a garment type (unknown types fall back to shirt). */
export function garmentFields(garmentType: string): readonly string[] {
  return garmentType === "trouser" ? TROUSER_FIELDS : SHIRT_FIELDS;
}

/** The base inputs the wizard asks for, per garment type (chest is dropped for trousers). */
export function wizardBaseFields(garmentType: string): readonly string[] {
  const fields = garmentFields(garmentType);
  return BASE_INPUTS.filter((b) => fields.includes(b));
}
