import { z } from "zod";

import type { EmailLocale } from "./email";

// Operations settings (FR-2B0/2B1/2B2, FR-10D0). Stored as one JSON value under
// the `operations` config key. Pure: schema + defaults + safe parse + the calm
// default pause message. The capacity / lead-time logic lives in ./capacity.

export const OPERATIONS_CONFIG_KEY = "operations";

const localizedMessageSchema = z.object({
  de: z.string(),
  en: z.string().optional(),
  it: z.string().optional(),
  fr: z.string().optional(),
});

export const operationsSettingsSchema = z.object({
  /** Max open (unfinished) orders before new orders pause. null = no cap. */
  capacityCap: z.number().int().nonnegative().nullable(),
  /** Manual pause toggle (shares the storefront gate with the cap + vacation). */
  paused: z.boolean(),
  /** Customer-facing message shown while paused (falls back to the calm default). */
  pauseMessage: localizedMessageSchema,
  /** Vacation window (ISO dates); within it ordering pauses too. */
  vacationFrom: z.string().nullable(),
  vacationUntil: z.string().nullable(),
  /** Days added to lead times when near the capacity high-water mark. */
  leadTimeBufferDays: z.number().int().nonnegative(),
  /** Fraction of the cap at which lead times start to extend (0..1). */
  capacityHighWaterFraction: z.number().min(0).max(1),
  /** Where admin notifications (new order, needs review, QC due) are sent. Optional. */
  adminEmail: z.string().nullable().default(null),
});

export type OperationsSettings = z.infer<typeof operationsSettingsSchema>;

/** Calm, reassuring default pause message (FR-2B2). */
export const CALM_PAUSE_MESSAGE: Record<EmailLocale, string> = {
  de: "Wir nehmen derzeit keine neuen Bestellungen an, um Qualität und Lieferzeit zu schützen. Bitte schauen Sie bald wieder vorbei.",
  en: "We are not accepting new orders right now to protect quality and delivery times. Please check back soon.",
  it: "Al momento non accettiamo nuovi ordini per tutelare qualita e tempi di consegna. Torni a trovarci presto.",
  fr: "Nous n'acceptons pas de nouvelles commandes pour le moment afin de preserver la qualite et les delais. Revenez bientot.",
};

export const DEFAULT_OPERATIONS_SETTINGS: OperationsSettings = {
  capacityCap: null,
  paused: false,
  pauseMessage: { ...CALM_PAUSE_MESSAGE },
  vacationFrom: null,
  vacationUntil: null,
  leadTimeBufferDays: 7,
  capacityHighWaterFraction: 0.8,
  adminEmail: null,
};

/** Parse a stored config value; fall back to safe defaults if missing or invalid. */
export function parseOperationsSettings(value: unknown): OperationsSettings {
  const parsed = operationsSettingsSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_OPERATIONS_SETTINGS;
}

/** The pause message for a locale: configured value, then German, then the calm default. */
export function pauseMessageFor(settings: OperationsSettings, locale: EmailLocale): string {
  const m = settings.pauseMessage;
  return m[locale] || m.de || CALM_PAUSE_MESSAGE[locale] || CALM_PAUSE_MESSAGE.de;
}
