import { getSupplier, upsertSupplier } from "@cutura/db";

import { environmentDb } from "@/server/catalog";
import { seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

// Configure the producer adapter per supplier: which adapter handles orders
// after approval ("" = classic spec email) and in which mode. Switching
// manual -> api later is exactly this form, no code change.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const form = await request.formData();
  const db = environmentDb("staging");
  const existing = await getSupplier(db, id);
  if (!existing) return seeOther("/suppliers?error=not_found");

  const adapter = String(form.get("adapter") ?? "").trim();
  const mode = String(form.get("mode") ?? "manual") === "api" ? "api" : "manual";
  await upsertSupplier(
    db,
    {
      id,
      name: existing.name,
      capabilities: adapter ? { adapter, mode } : null,
    },
    "admin",
  );
  return seeOther("/suppliers?saved=1");
}
