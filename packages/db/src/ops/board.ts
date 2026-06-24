import { desc, eq } from "drizzle-orm";

import { type GarmentMeasurements, type OrderStatus, checkOutliers } from "@cutura/core";

import type { Database } from "../getDb";
import { readOrderItemConfig, readSnapshot } from "../orders/snapshotIo";
import { order, orderItem, productionPackage } from "../schema";

export interface BoardOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalMinor: number;
  createdAt: string;
  itemCount: number;
  outlier: boolean;
  outlierFlags: string[];
}

type OrderItemRow = typeof orderItem.$inferSelect;

// Measurements for an item: prefer the immutable production snapshot, fall back to
// the frozen checkout config (orders not yet paid). Skips scrubbed/deleted data.
async function itemMeasurements(
  db: Database,
  item: OrderItemRow,
  key: string,
): Promise<{ garmentType: string; measurements: GarmentMeasurements } | null> {
  const [pkg] = await db
    .select({ enc: productionPackage.snapshotEnc })
    .from(productionPackage)
    .where(eq(productionPackage.orderItemId, item.id));
  if (pkg?.enc && pkg.enc !== "REDACTED") {
    const snap = await readSnapshot(pkg.enc, key);
    return { garmentType: snap.garmentType, measurements: snap.effectiveMeasurements };
  }
  if (item.configEnc) {
    const cfg = await readOrderItemConfig(item.configEnc, key);
    return { garmentType: cfg.garmentType, measurements: cfg.confirmedValues };
  }
  return null;
}

/**
 * The pipeline board (FR-1010): every order newest-first with a computed outlier
 * flag (FR-1020). The admin groups these into status lanes. Computes the flag
 * server-side from the snapshot - the measurements themselves are not returned.
 */
export async function getPipelineBoard(db: Database, key: string): Promise<BoardOrder[]> {
  const orders = await db.select().from(order).orderBy(desc(order.createdAt));
  const board: BoardOrder[] = [];
  for (const o of orders) {
    const items = await db.select().from(orderItem).where(eq(orderItem.orderId, o.id));
    let outlier = false;
    const outlierFlags: string[] = [];
    for (const it of items) {
      const m = await itemMeasurements(db, it, key);
      if (!m) continue;
      const c = checkOutliers(m.garmentType, m.measurements);
      if (c.isOutlier) {
        outlier = true;
        outlierFlags.push(...c.flags);
      }
    }
    board.push({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status as OrderStatus,
      totalMinor: o.totalMinor,
      createdAt: o.createdAt,
      itemCount: items.length,
      outlier,
      outlierFlags,
    });
  }
  return board;
}
