import { saveShippingZone } from "@cutura/db";

import { environmentDb } from "@/server/catalog";
import { seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  const countries = String(form.get("countries") ?? "")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
  if (!name || countries.length === 0) return seeOther("/shipping?error=required");
  await saveShippingZone(environmentDb("staging"), { name, countries });
  return seeOther("/shipping?saved=1");
}
