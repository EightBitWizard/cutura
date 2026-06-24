import { eq } from "drizzle-orm";

import type { Database } from "../getDb";
import { order, orderItem } from "../schema";
import { type Clock, nowIso, uuid } from "./types";

export interface NewOrderItem {
  baseModelId: string;
  /** Encrypted frozen snapshot inputs (config + confirmed measurements + override + price). */
  configEnc: string;
}

export interface NewOrder {
  orderNumber: string;
  guestEmail: string;
  guestTrackingToken: string;
  locale: string;
  totalMinor: number;
  acceptedTermsVersion: string;
  acceptedPrivacyVersion: string;
  items: NewOrderItem[];
}

/** Create a pending (status="new") guest order + its items. Returns ids in item order. */
export async function createGuestOrder(
  db: Database,
  input: NewOrder,
  deps: Clock = {},
): Promise<{ orderId: string; itemIds: string[] }> {
  const now = deps.now ?? nowIso;
  const id = deps.newId ?? uuid;
  const orderId = id();
  await db.insert(order).values({
    id: orderId,
    orderNumber: input.orderNumber,
    guestEmail: input.guestEmail,
    guestTrackingToken: input.guestTrackingToken,
    locale: input.locale,
    totalMinor: input.totalMinor,
    acceptedTermsVersion: input.acceptedTermsVersion,
    acceptedPrivacyVersion: input.acceptedPrivacyVersion,
    status: "new",
    createdAt: now(),
    updatedAt: now(),
  });
  const itemIds: string[] = [];
  for (const item of input.items) {
    const itemId = id();
    await db.insert(orderItem).values({
      id: itemId,
      orderId,
      baseModelId: item.baseModelId,
      status: "new",
      configEnc: item.configEnc,
      createdAt: now(),
      updatedAt: now(),
    });
    itemIds.push(itemId);
  }
  return { orderId, itemIds };
}

/** Resolve a local order id from its order number (webhook tag fallback). */
export async function findOrderIdByNumber(
  db: Database,
  orderNumber: string,
): Promise<string | null> {
  const [row] = await db.select().from(order).where(eq(order.orderNumber, orderNumber));
  return row?.id ?? null;
}

/** Read a full order row by id. */
export async function getOrderById(
  db: Database,
  id: string,
): Promise<typeof order.$inferSelect | undefined> {
  const [row] = await db.select().from(order).where(eq(order.id, id));
  return row;
}

/** Record the Shopify draft id + hosted-checkout URL on the order (resume / expiry). */
export async function attachShopifyDraft(
  db: Database,
  orderId: string,
  draftId: string,
  invoiceUrl: string,
): Promise<void> {
  await db
    .update(order)
    .set({ shopifyDraftId: draftId, invoiceUrl, updatedAt: new Date().toISOString() })
    .where(eq(order.id, orderId));
}
