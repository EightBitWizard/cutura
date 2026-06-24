import { and, eq } from "drizzle-orm";

import type { Database } from "../getDb";
import type { OrderItemConfig } from "../orders/types";
import { readOrderItemConfig } from "../orders/snapshotIo";
import { baseModel, order, orderItem } from "../schema";

export type ReorderMode = "keep" | "update" | "override";

export interface ReorderLine {
  handle: string;
  fabricCode: string | null;
  optionValueCodes: string[];
  upgradeCodes: string[];
  perPieceOverride?: Record<string, number>;
  reorder: { sourceOrderItemId: string; mode: ReorderMode };
}

/** Decrypt a past order item's frozen config, ownership-checked via the parent order. */
export async function getOrderItemConfigForCustomer(
  db: Database,
  customerId: string,
  orderItemId: string,
  key: string,
): Promise<OrderItemConfig | null> {
  const [row] = await db
    .select({ configEnc: orderItem.configEnc })
    .from(orderItem)
    .innerJoin(order, eq(orderItem.orderId, order.id))
    .where(and(eq(orderItem.id, orderItemId), eq(order.customerId, customerId)));
  if (!row?.configEnc) return null;
  return readOrderItemConfig(row.configEnc, key);
}

/**
 * Build a cart line that re-orders a past garment (FR-690). The measurement is NOT
 * stored in the cart - checkout resolves it from D1 per mode (keep = the source
 * order's confirmed values, update = the customer's latest profile, override =
 * keep + the given deltas). Returns null if the item is not owned or the model is
 * withdrawn.
 */
export async function buildReorderLine(
  db: Database,
  customerId: string,
  orderItemId: string,
  mode: ReorderMode,
  override: Record<string, number> | undefined,
  key: string,
): Promise<ReorderLine | null> {
  const [row] = await db
    .select({ configEnc: orderItem.configEnc, baseModelId: orderItem.baseModelId })
    .from(orderItem)
    .innerJoin(order, eq(orderItem.orderId, order.id))
    .where(and(eq(orderItem.id, orderItemId), eq(order.customerId, customerId)));
  if (!row?.configEnc) return null;
  const config = await readOrderItemConfig(row.configEnc, key);

  const [bm] = await db
    .select({ handle: baseModel.handle })
    .from(baseModel)
    .where(eq(baseModel.id, row.baseModelId));
  if (!bm) return null; // model withdrawn since the original order

  return {
    handle: bm.handle,
    fabricCode: config.fabricCode || null,
    optionValueCodes: Object.values(config.configuration),
    upgradeCodes: config.upgrades.map((u) => u.code),
    perPieceOverride: mode === "override" ? override : undefined,
    reorder: { sourceOrderItemId: orderItemId, mode },
  };
}
