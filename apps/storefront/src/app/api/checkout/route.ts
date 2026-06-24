import {
  type GarmentMeasurements,
  type MeasurementMethod,
  encryptJson,
  minorToDecimal,
  randomToken,
} from "@cutura/core";
import {
  type NewOrderItem,
  type OrderItemConfig,
  attachShopifyDraft,
  createGuestOrder,
  getCustomerProfileId,
  getDb,
  getOrderItemConfigForCustomer,
  getProfile,
} from "@cutura/db";

import { defaultLocale, isLocale } from "@/i18n/config";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/legal";
import { type CartLine, readCart, readCartToken } from "@/server/cart";
import { getEnv } from "@/server/env";
import { readMeasureToken, readMeasurementVersion } from "@/server/measurement";
import { getOrderingState } from "@/server/ops";
import { priceConfigured } from "@/server/pricing";
import { rateLimit } from "@/server/ratelimit";
import { getCustomerId } from "@/server/session";
import { createShopifyClient } from "@/server/shopify";

export const dynamic = "force-dynamic";

interface ResolvedMeasurement {
  confirmedValues: GarmentMeasurements;
  method: MeasurementMethod;
  version: number;
  override?: Record<string, number>;
}

// Resolve the measurement for one cart line. Reorder lines pull from the source
// order (keep/override) or the latest profile (update); a logged-in normal line
// uses the customer's profile; a guest uses the transient KV measurement.
async function resolveLineMeasurement(
  db: ReturnType<typeof getDb>,
  key: string,
  customerId: string | null,
  measureToken: string | undefined,
  line: CartLine,
): Promise<ResolvedMeasurement | null> {
  if (line.reorder && customerId) {
    if (line.reorder.mode === "update") {
      const profileId = await getCustomerProfileId(db, customerId);
      const profile = profileId ? await getProfile(db, customerId, profileId, key) : null;
      if (!profile) return null;
      return {
        confirmedValues: profile.confirmed,
        method: profile.method,
        version: profile.currentVersion,
        override: line.perPieceOverride,
      };
    }
    const src = await getOrderItemConfigForCustomer(
      db,
      customerId,
      line.reorder.sourceOrderItemId,
      key,
    );
    if (!src) return null;
    return {
      confirmedValues: src.confirmedValues,
      method: src.measurementMethod,
      version: src.measurementProfileVersion,
      override: line.reorder.mode === "override" ? line.perPieceOverride : src.override,
    };
  }
  if (customerId) {
    const profileId = await getCustomerProfileId(db, customerId);
    const profile = profileId ? await getProfile(db, customerId, profileId, key) : null;
    if (profile) {
      return {
        confirmedValues: profile.confirmed,
        method: profile.method,
        version: profile.currentVersion,
        override: line.perPieceOverride,
      };
    }
  }
  if (measureToken) {
    const m = await readMeasurementVersion(measureToken);
    if (m) {
      return {
        confirmedValues: m.confirmedValues,
        method: m.method,
        version: m.version,
        override: line.perPieceOverride,
      };
    }
  }
  return null;
}

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
  // Abuse protection on checkout creation (NFR-18).
  const ip = request.headers.get("cf-connecting-ip") ?? "anon";
  if (!(await rateLimit(env.RATE_LIMIT, `checkout:${ip}`, 10, 600))) {
    return Response.json({ error: "rate limited" }, { status: 429 });
  }
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

  // Server-authoritative pause gate (FR-2B0/2B1): never accept an order while paused.
  const ordering = await getOrderingState(locale);
  if (ordering.paused) {
    return Response.json({ error: "ordering paused", message: ordering.message }, { status: 409 });
  }

  const customerId = await getCustomerId();
  const measureToken = readMeasureToken(cookie);
  const db = getDb(env.DB);
  const key = env.MEASUREMENT_ENCRYPTION_KEY;
  const items: NewOrderItem[] = [];
  const lineMeta: Array<{
    title: string;
    totalMinor: number;
    version: number;
    selection: unknown;
  }> = [];
  let total = 0;

  for (const line of cart.lines) {
    // Recompute authoritatively from the current catalog (FR-7J0).
    const priced = await priceConfigured(db, line.handle, locale, line);
    if (!priced || !priced.valid) {
      return Response.json({ error: "invalid line" }, { status: 400 });
    }
    const m = await resolveLineMeasurement(db, key, customerId, measureToken, line);
    if (!m) return Response.json({ error: "missing measurement" }, { status: 400 });

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
      measurementMethod: m.method,
      measurementProfileVersion: m.version,
      confirmedValues: m.confirmedValues,
      override: m.override,
      price: priced.breakdown,
    };
    const configEnc = await encryptJson(config, key, "snapshot");
    items.push({ baseModelId: priced.model.id, configEnc });
    lineMeta.push({
      title: priced.model.name,
      totalMinor: priced.breakdown.total,
      version: m.version,
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
    customerId: customerId ?? undefined,
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
          { key: "_measurement_ref", value: `v${m.version}` },
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
