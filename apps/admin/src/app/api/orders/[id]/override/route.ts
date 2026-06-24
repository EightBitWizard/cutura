import { applyQcOverride } from "@cutura/db";

import { environmentDb } from "@/server/catalog";
import { seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const form = await request.formData();
  const orderItemId = String(form.get("orderItemId") ?? "");
  const overrideReason = String(form.get("overrideReason") ?? "").trim();
  if (orderItemId && overrideReason) {
    await applyQcOverride(environmentDb("staging"), {
      orderItemId,
      overrideReason,
      overrideBy: "admin",
    });
  }
  return seeOther(`/orders/${id}?override=1`);
}
