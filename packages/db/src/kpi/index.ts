import { and, eq } from "drizzle-orm";

import { averageDays, marginMinor, rate } from "@cutura/core";

import type { Database } from "../getDb";
import { getPipelineBoard } from "../ops/board";
import { fitReview, order, orderCost, orderItem, statusEvent } from "../schema";

export interface Kpis {
  totalOrders: number;
  paidOrders: number;
  revenueMinor: number;
  measurementCompletionRate: number;
  outlierRate: number;
  remakeRate: number;
  avgLeadTimeDays: number | null;
  avgMarginMinor: number | null;
  reorderRate: number;
}

/** Soft-launch KPI rollup (FR-1090, FR-10A0). Read-only aggregation over the env DB. */
export async function computeKpis(db: Database, key: string): Promise<Kpis> {
  const orders = await db.select().from(order);
  const items = await db.select().from(orderItem);
  const costs = await db.select().from(orderCost);
  const reviews = await db.select().from(fitReview);

  const totalOrders = orders.length;
  const paid = orders.filter((o) => o.status !== "new");
  const revenueMinor = paid.reduce((sum, o) => sum + o.totalMinor, 0);

  const withConfig = items.filter((i) => Boolean(i.configEnc)).length;
  const measurementCompletionRate = rate(withConfig, items.length);

  const board = await getPipelineBoard(db, key);
  const outlierRate = rate(board.filter((o) => o.outlier).length, totalOrders);

  const remakeCount = reviews.filter((r) => Boolean(r.remakeOrderId)).length;
  const remakeRate = rate(remakeCount, paid.length);

  // Lead time: order creation -> the shipped status event.
  const leadDurations: number[] = [];
  for (const o of orders.filter((x) => x.status === "shipped")) {
    const events = await db
      .select()
      .from(statusEvent)
      .where(and(eq(statusEvent.orderId, o.id), eq(statusEvent.toStatus, "shipped")));
    const shippedAt = events[0]?.createdAt;
    if (shippedAt) {
      const ms = Date.parse(shippedAt) - Date.parse(o.createdAt);
      if (Number.isFinite(ms) && ms >= 0) leadDurations.push(ms);
    }
  }
  const avgLeadTimeDays = averageDays(leadDurations);

  // Margin over orders with a captured cost.
  const orderById = new Map(orders.map((o) => [o.id, o]));
  const margins: number[] = [];
  for (const c of costs) {
    const o = orderById.get(c.orderId);
    if (o) margins.push(marginMinor(o.totalMinor, c));
  }
  const avgMarginMinor =
    margins.length > 0 ? Math.round(margins.reduce((a, b) => a + b, 0) / margins.length) : null;

  // Reorder rate: among orders tied to a customer, those beyond the customer's first.
  const customerOrders = orders.filter((o) => o.customerId);
  const perCustomer = new Map<string, number>();
  for (const o of customerOrders) {
    perCustomer.set(o.customerId!, (perCustomer.get(o.customerId!) ?? 0) + 1);
  }
  let reorders = 0;
  for (const count of perCustomer.values()) reorders += Math.max(0, count - 1);
  const reorderRate = rate(reorders, customerOrders.length);

  return {
    totalOrders,
    paidOrders: paid.length,
    revenueMinor,
    measurementCompletionRate,
    outlierRate,
    remakeRate,
    avgLeadTimeDays,
    avgMarginMinor,
    reorderRate,
  };
}

export interface OrderCostInput {
  fabricMinor?: number | null;
  productionMinor?: number | null;
  inboundMinor?: number | null;
  feesMinor?: number | null;
}

const nowIso = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

/** Create or update the per-order cost capture (FR-10A0). */
export async function upsertOrderCost(
  db: Database,
  orderId: string,
  input: OrderCostInput,
  deps: { now?: () => string; newId?: () => string } = {},
): Promise<void> {
  const now = (deps.now ?? nowIso)();
  const values = {
    fabricMinor: input.fabricMinor ?? null,
    productionMinor: input.productionMinor ?? null,
    inboundMinor: input.inboundMinor ?? null,
    feesMinor: input.feesMinor ?? null,
    updatedAt: now,
  };
  await db
    .insert(orderCost)
    .values({ id: (deps.newId ?? uuid)(), orderId, ...values, createdAt: now })
    .onConflictDoUpdate({ target: orderCost.orderId, set: values });
}

export async function getOrderCost(
  db: Database,
  orderId: string,
): Promise<typeof orderCost.$inferSelect | undefined> {
  const [row] = await db.select().from(orderCost).where(eq(orderCost.orderId, orderId));
  return row;
}
