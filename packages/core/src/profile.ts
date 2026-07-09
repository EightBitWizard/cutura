// Three-layer measurement model and versioning. The layers are kept separate:
// originalInputs (what the customer entered), derivedValues (what the estimator
// produced), and confirmedValues (what the customer explicitly confirmed and
// what production uses). Confirmed values never change silently: the only way to
// change them is reviseConfirmedValues, which produces a new, frozen version and
// retains the predecessor. See REQUIREMENTS.md E5 (US-5.5, US-5.6, US-5.9;
// FR-530, FR-531, FR-540, FR-570) and CLAUDE.md invariants.

import type { GarmentType, GarmentMeasurements, MeasurementMethod } from "./types";

export interface MeasurementProfileVersion {
  version: number;
  previousVersion: number | null;
  method: MeasurementMethod;
  /**
   * Explicit garment type of this version. Optional for historic versions;
   * persistence falls back to key-based inference when absent.
   */
  garmentType?: GarmentType;
  originalInputs: Partial<GarmentMeasurements>;
  derivedValues: Partial<GarmentMeasurements>;
  confirmedValues: GarmentMeasurements;
  createdAt: string;
}

export interface CreateProfileInput {
  method: MeasurementMethod;
  garmentType?: GarmentType;
  originalInputs: Partial<GarmentMeasurements>;
  derivedValues: Partial<GarmentMeasurements>;
  confirmedValues: GarmentMeasurements;
  createdAt: string;
}

function freezeVersion(v: MeasurementProfileVersion): Readonly<MeasurementProfileVersion> {
  Object.freeze(v.originalInputs);
  Object.freeze(v.derivedValues);
  Object.freeze(v.confirmedValues);
  return Object.freeze(v);
}

export function createProfileVersion(
  input: CreateProfileInput,
): Readonly<MeasurementProfileVersion> {
  return freezeVersion({
    version: 1,
    previousVersion: null,
    method: input.method,
    garmentType: input.garmentType,
    originalInputs: { ...input.originalInputs },
    derivedValues: { ...input.derivedValues },
    confirmedValues: { ...input.confirmedValues } as GarmentMeasurements,
    createdAt: input.createdAt,
  });
}

/**
 * The explicit, versioned action that changes confirmed values. Produces a new
 * frozen version (version + 1, linked to its predecessor) and never mutates the
 * previous version. This is the only sanctioned way to change confirmed values.
 */
export function reviseConfirmedValues(
  previous: MeasurementProfileVersion,
  changes: Partial<GarmentMeasurements>,
  createdAt: string,
): Readonly<MeasurementProfileVersion> {
  return freezeVersion({
    version: previous.version + 1,
    previousVersion: previous.version,
    method: previous.method,
    garmentType: previous.garmentType,
    originalInputs: { ...previous.originalInputs },
    derivedValues: { ...previous.derivedValues },
    confirmedValues: { ...previous.confirmedValues, ...changes } as GarmentMeasurements,
    createdAt,
  });
}

/** The measurements production uses: the confirmed layer of the version. */
export function effectiveProfileMeasurements(
  version: MeasurementProfileVersion,
): GarmentMeasurements {
  return version.confirmedValues;
}
