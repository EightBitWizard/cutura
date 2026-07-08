// Producer order-sheet assembly for the admin order page. Reads the frozen
// snapshot codes, the model handle, and the producer mapping, and returns the
// sheet + copyable text via the pure builder in @cutura/core. Returns null for
// classic email suppliers (no adapter configured).

import {
  type OrderSnapshot,
  type ProducerOrderSheet,
  buildProducerOrderSheet,
  buildSupplierSpec,
  parseSupplierCapabilities,
  renderProducerOrderSheetText,
} from "@cutura/core";
import { type Database, getBaseModelHandle, getProducerCodeMap } from "@cutura/db";

export interface ProducerSheetView {
  sheet: ProducerOrderSheet;
  text: string;
  mode: "manual" | "api";
}

export async function buildProducerSheetForItem(
  db: Database,
  input: {
    snapshot: OrderSnapshot;
    baseModelId: string;
    orderNumber: string;
    itemId: string;
    supplierCapabilities: unknown;
  },
): Promise<ProducerSheetView | null> {
  const caps = parseSupplierCapabilities(input.supplierCapabilities);
  if (!caps.adapter || caps.mode === "email") return null;

  const handle = await getBaseModelHandle(db, input.baseModelId);
  const spec = buildSupplierSpec(input.snapshot);
  const mapping = await getProducerCodeMap(db, caps.adapter, {
    modelHandle: handle ?? input.baseModelId,
    fabricCode: input.snapshot.fabricCode,
    optionPairs: Object.entries(input.snapshot.configuration).map(([g, v]) => `${g}:${v}`),
    upgradeCodes: input.snapshot.upgrades.map((u) => u.code),
  });
  const sheet = buildProducerOrderSheet(spec, {
    producer: caps.adapter,
    orderNumber: input.orderNumber,
    itemRef: input.itemId,
    mapping,
  });
  return { sheet, text: renderProducerOrderSheetText(sheet), mode: caps.mode };
}
