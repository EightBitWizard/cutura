import { marginMinor } from "@cutura/core";

import type { Database } from "../getDb";
import { order, orderCost } from "../schema";

/** RFC-4180 field escaping: quote if it contains a comma, quote, or newline. */
function csvField(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Orders + costs + margin as CSV for accounting (FR-10C0). Contains NO measurements
 * and no customer PII (no email/address) - just order, money, and dates.
 */
export async function exportOrdersCsv(db: Database): Promise<string> {
  const orders = await db.select().from(order);
  const costs = await db.select().from(orderCost);
  const costByOrder = new Map(costs.map((c) => [c.orderId, c]));

  const header = [
    "order_number",
    "status",
    "currency",
    "total_minor",
    "fabric_minor",
    "production_minor",
    "inbound_minor",
    "fees_minor",
    "margin_minor",
    "created_at",
  ];
  const lines = [header.join(",")];

  for (const o of orders) {
    const c = costByOrder.get(o.id);
    const margin = c ? marginMinor(o.totalMinor, c) : "";
    lines.push(
      [
        csvField(o.orderNumber),
        csvField(o.status),
        csvField(o.currency),
        csvField(o.totalMinor),
        csvField(c?.fabricMinor ?? ""),
        csvField(c?.productionMinor ?? ""),
        csvField(c?.inboundMinor ?? ""),
        csvField(c?.feesMinor ?? ""),
        csvField(margin),
        csvField(o.createdAt),
      ].join(","),
    );
  }
  return lines.join("\r\n");
}
