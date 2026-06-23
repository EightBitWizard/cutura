// QC checklist templates per garment type. Ported from the previous build. The
// single source of truth for both the admin QC form and the operational
// fallback. Item ids are persisted in the QC record - renaming an id orphans
// stored results, so treat ids as stable identifiers (REQUIREMENTS.md E8
// US-8.8, FR-870).

import type { GarmentType } from "./types";

export interface QcChecklistItem {
  id: string;
  label: string;
  result: "ok" | "fail" | "not_checked";
  note?: string;
}

export type QcChecklistTemplateItem = Pick<QcChecklistItem, "id" | "label">;

export const SHIRT_QC_CHECKLIST: readonly QcChecklistTemplateItem[] = [
  { id: "seams", label: "Nähte gleichmässig und sauber" },
  { id: "fabric", label: "Stoff korrekt (Code stimmt überein)" },
  { id: "buttons", label: "Knöpfe korrekt befestigt, alle vorhanden" },
  { id: "collar", label: "Kragen laut Spezifikation" },
  { id: "cuffs", label: "Manschetten laut Spezifikation" },
  { id: "measurements", label: "Kernmasse stichprobenhaft geprüft" },
  { id: "pressing", label: "Gebügelt, keine Druckstellen" },
  { id: "labeling", label: "Etiketten korrekt" },
  { id: "packaging", label: "Verpackung unbeschädigt" },
] as const;

export const TROUSER_QC_CHECKLIST: readonly QcChecklistTemplateItem[] = [
  { id: "seams", label: "Nähte gleichmässig und sauber" },
  { id: "fabric", label: "Stoff korrekt (Code stimmt überein)" },
  { id: "waistband", label: "Bund: sitzt gerade, Weite korrekt, Verschluss funktioniert" },
  { id: "fly", label: "Hosenschlitz: Reissverschluss/Knöpfe fest und sauber" },
  { id: "pockets", label: "Taschen symmetrisch, Beutel sauber vernäht" },
  { id: "beltLoops", label: "Gürtelschlaufen vollständig, fest vernäht" },
  { id: "measurements", label: "Kernmasse stichprobenhaft geprüft" },
  { id: "hem", label: "Saum sauber, gleichmässig, Länge korrekt" },
  { id: "pressing", label: "Gebügelt, keine Druckstellen" },
  { id: "labeling", label: "Etiketten korrekt" },
  { id: "packaging", label: "Verpackung unbeschädigt" },
] as const;

/** A fresh, mutable copy of the template for a garment type (trouser, else shirt). */
export function getDefaultQcChecklist(garmentType: GarmentType): QcChecklistTemplateItem[] {
  const template = garmentType === "trouser" ? TROUSER_QC_CHECKLIST : SHIRT_QC_CHECKLIST;
  return template.map((item) => ({ ...item }));
}
