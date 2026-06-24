import { setDefaultSupplier } from "@cutura/db";

import { environmentDb } from "@/server/catalog";
import { seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  await setDefaultSupplier(environmentDb("staging"), id, "admin");
  return seeOther("/suppliers?saved=1");
}
