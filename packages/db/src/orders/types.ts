import type { BuildSnapshotInput, OrderStatus } from "@cutura/core";

// The frozen snapshot inputs captured (encrypted) into order_item.config_enc at
// checkout. The paid webhook builds the immutable production snapshot from this,
// so it is independent of the transient guest measurement blob in KV. createdAt
// is set when the snapshot is built (at paid time), not stored here.
export type OrderItemConfig = Omit<BuildSnapshotInput, "createdAt">;

export interface VerifiedPaidEvent {
  /** Idempotency key (X-Shopify-Webhook-Id, or a reconcile:<id> synthetic key). */
  eventId: string;
  shopifyOrderId: string;
  /** The resolved CUTURA order id. */
  orderId: string;
  /** Webhook topic, e.g. "orders/paid". */
  type: string;
  payload: unknown;
}

export interface ProcessPaidResult {
  status: "processed" | "duplicate_ignored";
  productionPackageIds: string[];
}

export interface PipelineDeps {
  /** MEASUREMENT_ENCRYPTION_KEY (passed from the worker binding). */
  measurementKey: string;
  now?: () => string;
  newId?: () => string;
}

export interface Clock {
  now?: () => string;
  newId?: () => string;
}

export const nowIso = (): string => new Date().toISOString();
export const uuid = (): string => crypto.randomUUID();

export class InvalidTransitionError extends Error {
  constructor(
    public readonly from: OrderStatus,
    public readonly to: OrderStatus,
  ) {
    super(`invalid transition ${from} -> ${to}`);
    this.name = "InvalidTransitionError";
  }
}

export class OverrideNotAllowedError extends Error {
  constructor() {
    super("qc override is allowed only from qc_failed");
    this.name = "OverrideNotAllowedError";
  }
}

export class ShippingBlockedError extends Error {
  constructor(public readonly itemIds: string[]) {
    super(`shipping blocked: ${itemIds.length} item(s) not qc_passed`);
    this.name = "ShippingBlockedError";
  }
}
