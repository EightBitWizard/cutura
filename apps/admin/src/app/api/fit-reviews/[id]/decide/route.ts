import { createRemakeFromOrder, getFitReview, getOrderDetail, reviewFitRequest } from "@cutura/db";

import { environmentDb } from "@/server/catalog";
import { getEnv } from "@/server/env";
import { seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

// Minimal founder decision on a fit request (the polished queue is M5). remake
// builds a linked remake order from the original snapshot; refund/alteration record
// the decision (the Shopify refund is executed via the payment rail, live-deferred).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const form = await request.formData();
  const raw = String(form.get("decision") ?? "");
  const decision = raw === "remake" ? "remake" : raw === "alteration" ? "alteration" : "refund";

  const db = environmentDb("staging");
  const fr = await getFitReview(db, id);
  if (!fr) return seeOther("/orders");

  if (decision === "remake") {
    let orderItemId = fr.orderItemId;
    if (!orderItemId) {
      const detail = await getOrderDetail(db, fr.orderId);
      orderItemId = detail?.items[0]?.item.id ?? null;
    }
    if (orderItemId) {
      await createRemakeFromOrder(
        db,
        { fitReviewId: id, originalOrderItemId: orderItemId },
        getEnv().MEASUREMENT_ENCRYPTION_KEY,
      );
    }
  } else {
    await reviewFitRequest(db, id, decision, "admin");
  }
  return seeOther(`/orders/${fr.orderId}?fitdecision=1`);
}
