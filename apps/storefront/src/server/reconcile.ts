// Reconciliation against Shopify as the source of truth for payment (FR-761).
// Mitigates the risk that orders/paid may not fire for a draft checkout: any
// Shopify order tagged paid whose local order has no production package yet is
// run through the same idempotent pipeline (synthetic reconcile:<id> event key).
// processPaidEvent is safe to re-run - the productionPackage unique index makes
// an already-processed order a no-op. The Cron/scheduled trigger is wired
// separately (documented in the runbook).

import type { ShopifyClient } from "@cutura/core";
import { type Database, findOrderIdByNumber, processPaidEvent } from "@cutura/db";

export async function reconcileOrders(
  db: Database,
  shopify: ShopifyClient,
  sinceISO: string,
  measurementKey: string,
): Promise<{ checked: number; reconciled: number }> {
  const orders = await shopify.listOrdersByTag("cutura", sinceISO);
  let reconciled = 0;
  for (const o of orders) {
    if (o.financialStatus !== "PAID") continue;
    const tag = o.tags.find((t) => t.startsWith("cutura-order:"));
    if (!tag) continue;
    const orderId = await findOrderIdByNumber(db, tag.slice("cutura-order:".length));
    if (!orderId) continue;
    const result = await processPaidEvent(
      db,
      {
        eventId: `reconcile:${o.orderId}`,
        shopifyOrderId: o.orderId,
        orderId,
        type: "reconcile",
        payload: { reconciled: true },
      },
      { measurementKey },
    );
    if (result.status === "processed" && result.productionPackageIds.length > 0) reconciled++;
  }
  return { checked: orders.length, reconciled };
}
