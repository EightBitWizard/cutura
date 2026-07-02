import { garmentFields } from "@cutura/core";
import { buildReorderLine, getDb } from "@cutura/db";

import { defaultLocale, isLocale } from "@/i18n/config";
import { cartCookie, newCartToken, readCart, readCartToken, writeCart } from "@/server/cart";
import { getEnv } from "@/server/env";
import { redirectTo } from "@/server/http";
import { getCustomerId } from "@/server/session";

export const dynamic = "force-dynamic";

// Union of both garment types' supplier field sets (single source: packages/core).
const FIELDS = [...new Set([...garmentFields("shirt"), ...garmentFields("trouser")])];

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const rawLocale = String(form.get("locale") ?? "");
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const customerId = await getCustomerId();
  if (!customerId) return redirectTo(request, `/${locale}/account/login`);

  const orderItemId = String(form.get("orderItemId") ?? "");
  const modeRaw = String(form.get("mode") ?? "keep");
  const mode = modeRaw === "update" ? "update" : modeRaw === "override" ? "override" : "keep";
  const override: Record<string, number> = {};
  if (mode === "override") {
    for (const f of FIELDS) {
      const v = Number.parseFloat(String(form.get(f) ?? ""));
      if (!Number.isNaN(v) && v !== 0) override[f] = v;
    }
  }

  const env = getEnv();
  const line = await buildReorderLine(
    getDb(env.DB),
    customerId,
    orderItemId,
    mode,
    override,
    env.MEASUREMENT_ENCRYPTION_KEY,
  );
  if (!line) return redirectTo(request, `/${locale}/account/orders`);

  let token = readCartToken(request.headers.get("cookie"));
  const isNew = !token;
  if (!token) token = newCartToken();
  const cart = await readCart(token);
  cart.lines.push({
    handle: line.handle,
    fabricCode: line.fabricCode,
    optionValueCodes: line.optionValueCodes,
    upgradeCodes: line.upgradeCodes,
    perPieceOverride: line.perPieceOverride,
    qty: 1,
    reorder: line.reorder,
  });
  await writeCart(token, cart);

  return redirectTo(request, `/${locale}/cart`, isNew ? { "Set-Cookie": cartCookie(token) } : {});
}
