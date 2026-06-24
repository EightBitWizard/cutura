import { getDb } from "@cutura/db";

import { defaultLocale } from "@/i18n/config";
import { cartCookie, newCartToken, readCart, readCartToken, writeCart } from "@/server/cart";
import { getEnv } from "@/server/env";
import { getOrderingState } from "@/server/ops";
import { priceConfigured } from "@/server/pricing";

export const dynamic = "force-dynamic";

interface CartRequest {
  action?: "add" | "remove" | "override";
  handle?: string;
  fabricCode?: string | null;
  optionValueCodes?: string[];
  upgradeCodes?: string[];
  index?: number;
  override?: Record<string, number>;
}

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => null)) as CartRequest | null;
  if (!body) return Response.json({ error: "bad request" }, { status: 400 });

  let token = readCartToken(request.headers.get("cookie"));
  const isNew = !token;
  if (!token) token = newCartToken();
  const cart = await readCart(token);

  if (body.action === "remove") {
    if (typeof body.index === "number") cart.lines.splice(body.index, 1);
  } else if (body.action === "override") {
    const line = typeof body.index === "number" ? cart.lines[body.index] : undefined;
    if (line) line.perPieceOverride = body.override ?? {};
  } else {
    // add (default): recompute + validate from the current catalog before storing.
    if (typeof body.handle !== "string") {
      return Response.json({ error: "missing handle" }, { status: 400 });
    }
    const ordering = await getOrderingState(defaultLocale);
    if (ordering.paused) {
      return Response.json(
        { error: "ordering paused", message: ordering.message },
        { status: 409 },
      );
    }
    const priced = await priceConfigured(getDb(getEnv().DB), body.handle, defaultLocale, {
      fabricCode: body.fabricCode ?? null,
      optionValueCodes: Array.isArray(body.optionValueCodes) ? body.optionValueCodes : [],
      upgradeCodes: Array.isArray(body.upgradeCodes) ? body.upgradeCodes : [],
    });
    if (!priced || !priced.valid) {
      return Response.json({ error: "invalid configuration" }, { status: 400 });
    }
    cart.lines.push({
      handle: body.handle,
      fabricCode: priced.fabric?.code ?? null,
      optionValueCodes: priced.options.map((o) => o.valueCode),
      upgradeCodes: priced.upgrades.map((u) => u.code),
      qty: 1,
    });
  }

  await writeCart(token, cart);
  const headers = new Headers({ "content-type": "application/json" });
  if (isNew) headers.append("set-cookie", cartCookie(token));
  return new Response(JSON.stringify({ ok: true, lineCount: cart.lines.length }), { headers });
}
