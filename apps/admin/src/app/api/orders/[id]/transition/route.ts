import type { OrderStatus } from "@cutura/core";
import { getOrderDetail, transitionOrderItem, writeAudit } from "@cutura/db";

import { environmentDb } from "@/server/catalog";
import { seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

// Production progress driven manually while the producer connection runs in
// portal mode: "ordered in the producer portal" moves approved -> in_production,
// "parcel arrived in Switzerland" moves in_production -> arrived_ch. The status
// machine guards every transition; a future producer API webhook drives the same
// transitions automatically.
const MANUAL_TARGETS: Partial<Record<OrderStatus, OrderStatus>> = {
  in_production: "approved",
  arrived_ch: "in_production",
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const form = await request.formData();
  const target = String(form.get("target") ?? "") as OrderStatus;
  const from = MANUAL_TARGETS[target];
  if (!from) return seeOther(`/orders/${id}?error=invalid_target`);

  const db = environmentDb("staging");
  const detail = await getOrderDetail(db, id);
  if (!detail) return seeOther("/orders");

  let moved = 0;
  for (const d of detail.items) {
    if (d.item.status !== from) continue;
    await transitionOrderItem(db, {
      orderItemId: d.item.id,
      to: target,
      actor: "admin",
      reason: target === "in_production" ? "ordered in producer portal" : "arrived in CH",
    });
    moved += 1;
  }
  await writeAudit(db, {
    actor: "admin",
    action: `order.transition.${target}`,
    entityType: "order",
    entityId: id,
  });
  return seeOther(`/orders/${id}?moved=${moved}`);
}
