import { and, eq } from "drizzle-orm";

import { writeAudit } from "../audit";
import type { Database } from "../getDb";
import { fitFeedback, order } from "../schema";
import type { CustomerClock } from "./auth";

const nowIso = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

export interface SubmitFitFeedbackInput {
  customerId: string;
  orderId: string;
  overallRating?: number;
  fitByRegion?: unknown;
  notes?: string;
  wantsRemake?: boolean;
}

/**
 * Capture post-delivery fit feedback (FR-6B0); the estimator-improvement signal
 * (FR-8B0). Ownership-filtered (the order must belong to the customer). Few required
 * fields - the route enforces overallRating. Returns null if the order is not owned.
 */
export async function submitFitFeedback(
  db: Database,
  input: SubmitFitFeedbackInput,
  deps: CustomerClock = {},
): Promise<{ id: string } | null> {
  const [o] = await db
    .select({ id: order.id })
    .from(order)
    .where(and(eq(order.id, input.orderId), eq(order.customerId, input.customerId)));
  if (!o) return null;

  const now = (deps.now ?? nowIso)();
  const id = (deps.newId ?? uuid)();
  await db.insert(fitFeedback).values({
    id,
    orderId: input.orderId,
    overallRating: input.overallRating ?? null,
    fitByRegion: input.fitByRegion ?? null,
    notes: input.notes ?? null,
    wantsRemake: input.wantsRemake ?? false,
    createdAt: now,
    updatedAt: now,
  });
  await writeAudit(db, {
    actor: `customer:${input.customerId}`,
    action: "fit_feedback.submitted",
    entityType: "fitFeedback",
    entityId: id,
  });
  return { id };
}
