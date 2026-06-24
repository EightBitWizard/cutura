import { upsertSupplier } from "@cutura/db";

import { environmentDb } from "@/server/catalog";
import { seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  if (!name) return seeOther("/suppliers?error=required");
  const contactEmail = String(form.get("contactEmail") ?? "").trim();
  await upsertSupplier(
    environmentDb("staging"),
    {
      name,
      contact: contactEmail ? { email: contactEmail } : null,
      notes: String(form.get("notes") ?? "").trim() || null,
      isDefault: form.get("isDefault") === "on",
    },
    "admin",
  );
  return seeOther("/suppliers?saved=1");
}
