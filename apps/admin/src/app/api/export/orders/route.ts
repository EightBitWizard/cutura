import { exportOrdersCsv } from "@cutura/db";

import { environmentDb } from "@/server/catalog";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const csv = await exportOrdersCsv(environmentDb("staging"));
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="cutura-orders.csv"',
    },
  });
}
