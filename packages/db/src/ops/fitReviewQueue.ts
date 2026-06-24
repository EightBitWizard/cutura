import { desc, eq } from "drizzle-orm";

import type { Database } from "../getDb";
import { fitReview, order } from "../schema";

export interface FitReviewQueueItem {
  id: string;
  orderId: string;
  orderNumber: string;
  reason: string;
  photoCount: number;
  status: string;
  decision: string | null;
  createdAt: string;
}

/** The fit-review / remake queue (FR-1030), newest-first, optionally filtered by status. */
export async function listFitReviews(db: Database, status?: string): Promise<FitReviewQueueItem[]> {
  const rows = await db
    .select({ fr: fitReview, orderNumber: order.orderNumber })
    .from(fitReview)
    .innerJoin(order, eq(fitReview.orderId, order.id))
    .orderBy(desc(fitReview.createdAt));
  return rows
    .filter((r) => !status || r.fr.status === status)
    .map((r) => ({
      id: r.fr.id,
      orderId: r.fr.orderId,
      orderNumber: r.orderNumber,
      reason: r.fr.reason,
      photoCount: Array.isArray(r.fr.photoR2Keys) ? r.fr.photoR2Keys.length : 0,
      status: r.fr.status,
      decision: r.fr.decision,
      createdAt: r.fr.createdAt,
    }));
}
