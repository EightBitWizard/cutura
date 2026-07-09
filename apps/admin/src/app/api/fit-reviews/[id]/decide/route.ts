import {
  createRemakeFromOrder,
  executeOrderRefund,
  getFitReview,
  getOrderDetail,
  reviewFitRequest,
} from "@cutura/db";

import { environmentDb } from "@/server/catalog";
import { getEnv } from "@/server/env";
import { seeOther } from "@/server/http";
import { shopifyConfigured, shopifyRefund } from "@/server/shopify";

export const dynamic = "force-dynamic";

// The full decision vocabulary. Anything outside it is rejected: an unknown value
// must never fall through to the money-moving refund branch.
const DECISIONS = ["remake", "refund", "alteration"] as const;
type Decision = (typeof DECISIONS)[number];

function parseDecision(value: FormDataEntryValue | null): Decision | null {
  const raw = String(value ?? "");
  return (DECISIONS as readonly string[]).includes(raw) ? (raw as Decision) : null;
}

// Founder decision on a fit request. remake builds a linked remake order from the
// original snapshot; refund records the decision and, when Shopify is configured,
// executes the money-back refund via the payment rail (audited); alteration records
// the decision only.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const form = await request.formData();
  const decision = parseDecision(form.get("decision"));
  if (!decision) return seeOther("/fit-reviews?error=invalid_decision");

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
    // Money-back fallback: execute the Shopify refund when configured (else the
    // decision stays recorded for the founder to refund manually). Audited either way.
    if (decision === "refund") {
      const env = getEnv();
      if (shopifyConfigured(env)) {
        await executeOrderRefund(db, {
          orderId: fr.orderId,
          actor: "admin",
          reason: "Fit guarantee refund",
          refund: (input) => shopifyRefund(env, input),
        });
      }
    }
  }
  return seeOther(`/orders/${fr.orderId}?fitdecision=1`);
}
