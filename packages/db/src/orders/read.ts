import { count, desc, eq, ne } from "drizzle-orm";

import type { Database } from "../getDb";
import { order, orderItem, productionPackage, qcRecord, statusEvent } from "../schema";

export type OrderRow = typeof order.$inferSelect;
export type OrderItemRow = typeof orderItem.$inferSelect;
export type ProductionPackageRow = typeof productionPackage.$inferSelect;
export type QcRecordRow = typeof qcRecord.$inferSelect;
export type StatusEventRow = typeof statusEvent.$inferSelect;

export interface OrderItemDetail {
  item: OrderItemRow;
  pkg: ProductionPackageRow | undefined;
  qc: QcRecordRow | undefined;
}

export interface OrderDetail {
  order: OrderRow;
  items: OrderItemDetail[];
  events: StatusEventRow[];
}

/** Orders newest-first for the admin list. */
export function listOrders(db: Database): Promise<OrderRow[]> {
  return db.select().from(order).orderBy(desc(order.createdAt));
}

/** Count of open (not-yet-shipped) orders - the production load for the capacity cap (FR-2B0). */
export async function countOpenOrders(db: Database): Promise<number> {
  const [row] = await db.select({ c: count() }).from(order).where(ne(order.status, "shipped"));
  return row?.c ?? 0;
}

/** Full order detail for the admin order page: items + their package + QC, and the timeline. */
export async function getOrderDetail(db: Database, orderId: string): Promise<OrderDetail | null> {
  const [ord] = await db.select().from(order).where(eq(order.id, orderId));
  if (!ord) return null;

  const items = await db.select().from(orderItem).where(eq(orderItem.orderId, orderId));
  const detail: OrderItemDetail[] = [];
  for (const item of items) {
    const [pkg] = await db
      .select()
      .from(productionPackage)
      .where(eq(productionPackage.orderItemId, item.id));
    let qc: QcRecordRow | undefined;
    if (pkg) {
      [qc] = await db.select().from(qcRecord).where(eq(qcRecord.productionPackageId, pkg.id));
    }
    detail.push({ item, pkg, qc });
  }

  const events = await db
    .select()
    .from(statusEvent)
    .where(eq(statusEvent.orderId, orderId))
    .orderBy(statusEvent.createdAt);

  return { order: ord, items: detail, events };
}
