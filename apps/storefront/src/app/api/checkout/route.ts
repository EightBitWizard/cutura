import { encryptJson, minorToDecimal, randomToken } from "@cutura/core";
import {
  type NewOrderItem,
  type OrderItemConfig,
  attachShopifyDraft,
  createGuestOrder,
  getDb,
} from "@cutura/db";

import { defaultLocale, isLocale } from "@/i18n/config";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/legal";
import { readCart, readCartToken } from "@/server/cart";
import { getEnv } from "@/server/env";
import { readMeasureToken, readMeasurementVersion } from "@/server/measurement";
import { priceConfigured } from "@/server/pricing";
import { createShopifyClient } from "@/server/shopify";

export const dynamic = "force-dynamic";

interface CheckoutBody {
  locale?: string;
  email?: string;
  address?: { line1?: string; city?: string; zip?: string; country?: string };
  phone?: string | null;
  acceptedTermsVersion?: string;
  acceptedPrivacyVersion?: string;
}

export async function POST(request: Request): Promise<Response> {
  const env = getEnv();
  const body = (await request.json().catch(() => null)) as CheckoutBody | null;
  if (!body) return Response.json({ error: "bad request" }, { status: 400 });

  const raw = body.locale ?? "";
  const locale = isLocale(raw) ? raw : defaultLocale;
  const email = (body.email ?? "").trim();
  const addr = body.address ?? {};
  const country = addr.country === "LI" ? "LI" : addr.country === "CH" ? "CH" : null;
  if (!email || !addr.line1 || !addr.city || !addr.zip || !country) {
    return Response.json({ error: "missing fields" }, { status: 400 });
  }
  // Re-capture + verify the accepted legal versions (FR-781); never trust the client.
  if (
    body.acceptedTermsVersion !== TERMS_VERSION ||
    body.acceptedPrivacyVersion !== PRIVACY_VERSION
  ) {
    return Response.json({ error: "stale consent" }, { status: 400 });
  }

  const cookie = request.headers.get("cookie");
  const cart = await readCart(readCartToken(cookie));
  if (cart.lines.length === 0) return Response.json({ error: "empty cart" }, { status: 400 });

  const measureToken = readMeasureToken(cookie);
  const measurement = measureToken ? await readMeasurementVersion(measureToken) : null;
  if (!measurement) return Response.json({ error: "missing measurement" }, { status: 400 });

  const db = getDb(env.DB);
  const items: NewOrderItem[] = [];
  const lineMeta: Array<{ title: string; totalMinor: number; selection: unknown }> = [];
  let total = 0;

  for (const line of cart.lines) {
    // Recompute authoritatively from the current catalog (FR-7J0).
    const priced = await priceConfigured(db, line.handle, locale, line);
    if (!priced || !priced.valid) {
      return Response.json({ error: "invalid line" }, { status: 400 });
    }
    const config: OrderItemConfig = {
      baseModelName: priced.model.name,
      fabricCode: priced.fabric?.code ?? "",
      configuration: Object.fromEntries(priced.options.map((o) => [o.groupCode, o.valueCode])),
      upgrades: priced.upgrades.map((u) => ({
        code: u.code,
        placement: u.placement ?? undefined,
        priceMinor: u.priceMinor,
      })),
      garmentType: priced.model.garmentType,
      measurementMethod: measurement.method,
      measurementProfileVersion: measurement.version,
      confirmedValues: measurement.confirmedValues,
      override: line.perPieceOverride,
      price: priced.breakdown,
    };
    const configEnc = await encryptJson(config, env.MEASUREMENT_ENCRYPTION_KEY, "snapshot");
    items.push({ baseModelId: priced.model.id, configEnc });
    lineMeta.push({
      title: priced.model.name,
      totalMinor: priced.breakdown.total,
      selection: {
        fabricCode: line.fabricCode,
        optionValueCodes: line.optionValueCodes,
        upgradeCodes: line.upgradeCodes,
      },
    });
    total += priced.breakdown.total;
  }

  const orderNumber = `CUT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const { orderId, itemIds } = await createGuestOrder(db, {
    orderNumber,
    guestEmail: email,
    guestTrackingToken: randomToken(24),
    locale,
    totalMinor: total,
    acceptedTermsVersion: TERMS_VERSION,
    acceptedPrivacyVersion: PRIVACY_VERSION,
    items,
  });

  const shopify = createShopifyClient(env);
  let draft;
  try {
    draft = await shopify.createDraftOrder({
      orderNumber,
      email,
      lineItems: lineMeta.map((m, i) => ({
        quantity: 1,
        title: m.title,
        unitPrice: { amount: minorToDecimal(m.totalMinor), currencyCode: "CHF" },
        taxable: true,
        customAttributes: [
          { key: "_cutura_order_item_id", value: itemIds[i] ?? "" },
          { key: "_measurement_ref", value: `${measureToken}:${measurement.version}` },
          { key: "_config", value: JSON.stringify(m.selection) },
        ],
      })),
      shippingLine: {
        title: "Standardversand inklusive",
        price: { amount: "0.00", currencyCode: "CHF" },
      },
      shippingAddress: { line1: addr.line1, city: addr.city, zip: addr.zip, country },
      tags: ["cutura", `cutura-order:${orderNumber}`, `env:${env.CUTURA_ENV}`],
      note: `CUTURA ${orderNumber}`,
      attributes: [
        { key: "_cutura_order_id", value: orderId },
        { key: "_terms_version", value: TERMS_VERSION },
        { key: "_privacy_version", value: PRIVACY_VERSION },
      ],
    });
  } catch {
    return Response.json({ error: "payment provider unavailable" }, { status: 502 });
  }

  if (draft.userErrors.length > 0 || !draft.invoiceUrl) {
    return Response.json({ error: "draft order failed" }, { status: 502 });
  }
  await attachShopifyDraft(db, orderId, draft.draftId, draft.invoiceUrl);
  return Response.json({ checkoutUrl: draft.invoiceUrl });
}
