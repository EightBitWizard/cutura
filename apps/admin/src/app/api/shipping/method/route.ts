import { saveShippingMethod } from "@cutura/db";

import { environmentDb } from "@/server/catalog";
import { seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const zoneId = String(form.get("zoneId") ?? "").trim();
  const code = String(form.get("code") ?? "").trim();
  if (!zoneId || !code) return seeOther("/shipping?error=required");
  await saveShippingMethod(environmentDb("staging"), {
    zoneId,
    code,
    priceMinor: Math.max(0, Math.trunc(Number(form.get("priceMinor")) || 0)),
    kind: form.get("kind") === "express" ? "express" : "standard",
    includedInPrice: form.get("includedInPrice") === "on",
  });
  return seeOther("/shipping?saved=1");
}
