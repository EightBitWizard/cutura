import { type EmailLocale } from "@cutura/core";
import { getOrderDetail, readSnapshot, renderParcelCardPdf } from "@cutura/db";

import { environmentDb } from "@/server/catalog";
import { getEnv } from "@/server/env";

export const dynamic = "force-dynamic";

const LOCALES = ["de", "en", "it", "fr"];

// The packaging step (FR-8E0): generate the localized parcel card for an order.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const db = environmentDb("staging");
  const detail = await getOrderDetail(db, id);
  if (!detail) return new Response("not found", { status: 404 });

  const first = detail.items[0];
  let garmentType = "shirt";
  if (first?.pkg) {
    const snap = await readSnapshot(first.pkg.snapshotEnc, getEnv().MEASUREMENT_ENCRYPTION_KEY);
    garmentType = snap.garmentType;
  }
  const locale = (
    LOCALES.includes(detail.order.locale) ? detail.order.locale : "de"
  ) as EmailLocale;

  const pdf = await renderParcelCardPdf({
    orderNumber: detail.order.orderNumber,
    garmentType,
    locale,
  });
  return new Response(pdf as unknown as BodyInit, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="parcel-card-${detail.order.orderNumber}.pdf"`,
    },
  });
}
