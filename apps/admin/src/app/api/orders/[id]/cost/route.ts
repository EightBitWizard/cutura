import { upsertOrderCost } from "@cutura/db";

import { environmentDb } from "@/server/catalog";
import { seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

function minor(form: FormData, key: string): number | null {
  const v = form.get(key);
  if (v === null || String(v).trim() === "") return null;
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const form = await request.formData();
  await upsertOrderCost(environmentDb("staging"), id, {
    fabricMinor: minor(form, "fabricMinor"),
    productionMinor: minor(form, "productionMinor"),
    inboundMinor: minor(form, "inboundMinor"),
    feesMinor: minor(form, "feesMinor"),
  });
  return seeOther(`/orders/${id}?saved=1`);
}
