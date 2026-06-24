import {
  type LeadTimeRange,
  type OperationsSettings,
  effectiveLeadTime,
  isOrderingPaused,
  pauseMessageFor,
} from "@cutura/core";
import { countOpenOrders, getDb, getOperationsSettings } from "@cutura/db";

import type { Locale } from "@/i18n/config";
import { getEnv } from "./env";

export interface OrderingState {
  paused: boolean;
  message: string;
  settings: OperationsSettings;
  openOrderCount: number;
}

/** Read the storefront ordering state (capacity + pause + vacation) from the DB. */
export async function getOrderingState(locale: Locale): Promise<OrderingState> {
  const db = getDb(getEnv().DB);
  const settings = await getOperationsSettings(db);
  const openOrderCount = await countOpenOrders(db);
  return {
    paused: isOrderingPaused(settings, openOrderCount, new Date()),
    message: pauseMessageFor(settings, locale),
    settings,
    openOrderCount,
  };
}

/** Capacity-aware lead-time range for display (FR-10D0). */
export function leadTimeFor(state: OrderingState, minDays: number, maxDays: number): LeadTimeRange {
  return effectiveLeadTime(minDays, maxDays, state.openOrderCount, state.settings);
}
