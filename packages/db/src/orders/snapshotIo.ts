import { type OrderSnapshot, buildOrderSnapshot, decryptJson, encryptJson } from "@cutura/core";

import type { OrderItemConfig } from "./types";

// The "snapshot" encryption purpose covers both the checkout-frozen order_item
// config blob and the production-package snapshot blob (both order-side body data).

/** Decrypt the checkout-frozen order_item config (snapshot inputs). */
export function readOrderItemConfig(
  configEnc: string,
  measurementKey: string,
): Promise<OrderItemConfig> {
  return decryptJson<OrderItemConfig>(configEnc, measurementKey, "snapshot");
}

/** Build the immutable snapshot from the frozen config and return its ciphertext. */
export async function buildAndEncryptSnapshot(
  config: OrderItemConfig,
  createdAt: string,
  measurementKey: string,
): Promise<{ snapshot: Readonly<OrderSnapshot>; cipher: string }> {
  const snapshot = buildOrderSnapshot({ ...config, createdAt });
  const cipher = await encryptJson(snapshot, measurementKey, "snapshot");
  return { snapshot, cipher };
}

/** Decrypt a stored production-package snapshot (admin order detail / supplier spec). */
export function readSnapshot(snapshotEnc: string, measurementKey: string): Promise<OrderSnapshot> {
  return decryptJson<OrderSnapshot>(snapshotEnc, measurementKey, "snapshot");
}
