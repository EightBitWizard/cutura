import { and, desc, eq } from "drizzle-orm";

import { isWithinFitReviewWindow } from "@cutura/core";

import { writeAudit } from "../audit";
import type { Database } from "../getDb";
import { fitReview, order, orderItem, productionPackage, statusEvent } from "../schema";
import type { CustomerClock } from "./auth";

const FIT_REVIEW_WINDOW_DAYS = 30;
const nowIso = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

export type FitReviewResult =
  | { ok: true; id: string }
  | { ok: false; reason: "not_owner" | "window" | "already" | "no_package" };

export interface SubmitFitReviewInput {
  customerId: string;
  orderId: string;
  orderItemId?: string;
  reason: string;
  photoR2Keys?: string[];
}

/**
 * Submit a fit-review/remake request (FR-6A0, FR-8A3). Bounded: ownership, within
 * the window measured from the shipped event, and once per garment type across the
 * customer's orders.
 */
export async function submitFitReview(
  db: Database,
  input: SubmitFitReviewInput,
  opts: { windowDays?: number; now?: () => string } = {},
): Promise<FitReviewResult> {
  const [o] = await db
    .select()
    .from(order)
    .where(and(eq(order.id, input.orderId), eq(order.customerId, input.customerId)));
  if (!o) return { ok: false, reason: "not_owner" };

  const shippedEvents = await db
    .select()
    .from(statusEvent)
    .where(and(eq(statusEvent.orderId, input.orderId), eq(statusEvent.toStatus, "shipped")))
    .orderBy(desc(statusEvent.createdAt));
  const shippedAt = shippedEvents[0]?.createdAt ?? null;
  const now = (opts.now ?? nowIso)();
  if (!isWithinFitReviewWindow(shippedAt, now, opts.windowDays ?? FIT_REVIEW_WINDOW_DAYS)) {
    return { ok: false, reason: "window" };
  }

  const pkgs = await db
    .select({ gt: productionPackage.garmentType })
    .from(productionPackage)
    .innerJoin(orderItem, eq(productionPackage.orderItemId, orderItem.id))
    .where(eq(orderItem.orderId, input.orderId));
  const garmentType = pkgs[0]?.gt;
  if (!garmentType) return { ok: false, reason: "no_package" };

  // Once per garment type across the customer's orders.
  const existing = await db
    .select({ gt: productionPackage.garmentType })
    .from(fitReview)
    .innerJoin(order, eq(fitReview.orderId, order.id))
    .innerJoin(orderItem, eq(orderItem.orderId, order.id))
    .innerJoin(productionPackage, eq(productionPackage.orderItemId, orderItem.id))
    .where(eq(order.customerId, input.customerId));
  if (existing.some((r) => r.gt === garmentType)) return { ok: false, reason: "already" };

  const id = uuid();
  await db.insert(fitReview).values({
    id,
    orderId: input.orderId,
    orderItemId: input.orderItemId ?? null,
    reason: input.reason,
    photoR2Keys: input.photoR2Keys ?? null,
    status: "open",
    decision: null,
    remakeOrderId: null,
    createdAt: now,
    updatedAt: now,
  });
  await writeAudit(db, {
    actor: `customer:${input.customerId}`,
    action: "fit_review.submitted",
    entityType: "fitReview",
    entityId: id,
  });
  return { ok: true, id };
}

export async function getFitReview(
  db: Database,
  id: string,
): Promise<typeof fitReview.$inferSelect | undefined> {
  const [row] = await db.select().from(fitReview).where(eq(fitReview.id, id));
  return row;
}

/** Founder decision on a fit request (FR-8A0). Sets the decision + status; remake/refund act separately. */
export async function reviewFitRequest(
  db: Database,
  fitReviewId: string,
  decision: "remake" | "refund" | "alteration",
  actor: string,
  deps: CustomerClock = {},
): Promise<void> {
  const now = (deps.now ?? nowIso)();
  await db
    .update(fitReview)
    .set({ decision, status: "decided", updatedAt: now })
    .where(eq(fitReview.id, fitReviewId));
  await writeAudit(db, {
    actor,
    action: "fit_review.decided",
    entityType: "fitReview",
    entityId: fitReviewId,
    detail: { decision },
  });
}
