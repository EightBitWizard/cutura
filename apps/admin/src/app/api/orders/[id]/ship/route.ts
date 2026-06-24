import { type EmailLocale } from "@cutura/core";
import {
  ResendEmailProvider,
  getOrderById,
  renderShippedEmail,
  sendEmailAndLog,
  shipOrder,
} from "@cutura/db";

import { environmentDb } from "@/server/catalog";
import { getEnv } from "@/server/env";
import { seeOther } from "@/server/http";

const LOCALES: EmailLocale[] = ["de", "en", "it", "fr"];

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const env = getEnv();
  const db = environmentDb("staging");
  try {
    await shipOrder(db, { orderId: id, actor: "admin" });
  } catch {
    return seeOther(`/orders/${id}?error=ship`);
  }

  const order = await getOrderById(db, id);
  if (order?.guestEmail) {
    const locale = LOCALES.includes(order.locale as EmailLocale)
      ? (order.locale as EmailLocale)
      : "de";
    await sendEmailAndLog(
      db,
      new ResendEmailProvider(env.EMAIL_PROVIDER_KEY),
      renderShippedEmail({ to: order.guestEmail, orderNumber: order.orderNumber }, locale),
      { orderId: id, template: "shipped" },
    );
  }
  return seeOther(`/orders/${id}?shipped=1`);
}
