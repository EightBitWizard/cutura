import { recordPreReleaseCorrection } from "@cutura/db";

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
  const note = String(form.get("note") ?? "").trim();
  if (note) {
    await recordPreReleaseCorrection(environmentDb("staging"), { orderItemId, note }, "admin");
  }
  return seeOther(`/orders/${id}?corrected=1`);
}
