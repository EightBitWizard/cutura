import { deleteCrossSellRule } from "@cutura/db";

import { controlDb } from "@/server/catalog";
import { seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  await deleteCrossSellRule(controlDb(), id);
  return seeOther("/cross-sell?deleted=1");
}
