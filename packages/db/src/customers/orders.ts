import { and, desc, eq } from "drizzle-orm";

import { type CustomerMilestone, type OrderStatus, customerMilestone } from "@cutura/core";

import type { Database } from "../getDb";
import { readOrderItemConfig } from "../orders/snapshotIo";
import { order, orderItem, statusEvent } from "../schema";

export interface CustomerOrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  milestone: CustomerMilestone;
  totalMinor: number;
  createdAt: string;
  itemCount: number;
}

export interface CustomerOrderItem {
  id: string;
  baseModelName: string;
  fabricCode: string;
  configuration: Record<string, string>;
  upgrades: Array<{ code: string; placement?: string; priceMinor: number }>;
  status: OrderStatus;
  milestone: CustomerMilestone;
  measurements: Record<string, number>;
}

export interface CustomerOrderDetail {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  milestone: CustomerMilestone;
  totalMinor: number;
  createdAt: string;
  items: CustomerOrderItem[];
  timeline: Array<{ milestone: CustomerMilestone; at: string }>;
}

type OrderRow = typeof order.$inferSelect;

/** A customer's orders, newest first (no internal/ops data). */
export async function listCustomerOrders(
  db: Database,
  customerId: string,
): Promise<CustomerOrderSummary[]> {
  const orders = await db
    .select()
    .from(order)
    .where(eq(order.customerId, customerId))
    .orderBy(desc(order.createdAt));
  const result: CustomerOrderSummary[] = [];
  for (const o of orders) {
    const items = await db
      .select({ id: orderItem.id })
      .from(orderItem)
      .where(eq(orderItem.orderId, o.id));
    result.push({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status as OrderStatus,
      milestone: customerMilestone(o.status as OrderStatus),
      totalMinor: o.totalMinor,
      createdAt: o.createdAt,
      itemCount: items.length,
    });
  }
  return result;
}

async function buildDetail(db: Database, o: OrderRow, key: string): Promise<CustomerOrderDetail> {
  const itemRows = await db.select().from(orderItem).where(eq(orderItem.orderId, o.id));
  const items: CustomerOrderItem[] = [];
  for (const it of itemRows) {
    let baseModelName = "";
    let fabricCode = "";
    let configuration: Record<string, string> = {};
    let upgrades: CustomerOrderItem["upgrades"] = [];
    let measurements: Record<string, number> = {};
    if (it.configEnc) {
      const config = await readOrderItemConfig(it.configEnc, key);
      baseModelName = config.baseModelName;
      fabricCode = config.fabricCode;
      configuration = config.configuration;
      upgrades = config.upgrades;
      measurements = config.confirmedValues as unknown as Record<string, number>;
    }
    items.push({
      id: it.id,
      baseModelName,
      fabricCode,
      configuration,
      upgrades,
      status: it.status as OrderStatus,
      milestone: customerMilestone(it.status as OrderStatus),
      measurements,
    });
  }

  const events = await db
    .select()
    .from(statusEvent)
    .where(eq(statusEvent.orderId, o.id))
    .orderBy(statusEvent.createdAt);
  const timeline: CustomerOrderDetail["timeline"] = [];
  for (const e of events) {
    const milestone = customerMilestone(e.toStatus as OrderStatus);
    if (milestone === "attention") continue; // do not surface internal escalations
    if (timeline.length > 0 && timeline[timeline.length - 1]!.milestone === milestone) continue;
    timeline.push({ milestone, at: e.createdAt });
  }

  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status as OrderStatus,
    milestone: customerMilestone(o.status as OrderStatus),
    totalMinor: o.totalMinor,
    createdAt: o.createdAt,
    items,
    timeline,
  };
}

/**
 * True if the order exists and belongs to the customer. Cheap ownership check
 * (no decryption); use it to gate side effects (e.g. photo uploads) before any
 * heavier write path runs.
 */
export async function customerOwnsOrder(
  db: Database,
  customerId: string,
  orderId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: order.id })
    .from(order)
    .where(and(eq(order.id, orderId), eq(order.customerId, customerId)));
  return row !== undefined;
}

/** A customer's order detail, ownership-filtered. Null if not owned. */
export async function getCustomerOrderDetail(
  db: Database,
  customerId: string,
  orderId: string,
  key: string,
): Promise<CustomerOrderDetail | null> {
  const [o] = await db
    .select()
    .from(order)
    .where(and(eq(order.id, orderId), eq(order.customerId, customerId)));
  if (!o) return null;
  return buildDetail(db, o, key);
}

/** Public order tracking by guest token (no auth). Null if the token is unknown. */
export async function getOrderByTrackingToken(
  db: Database,
  token: string,
  key: string,
): Promise<CustomerOrderDetail | null> {
  if (!token) return null;
  const [o] = await db.select().from(order).where(eq(order.guestTrackingToken, token));
  if (!o) return null;
  return buildDetail(db, o, key);
}
