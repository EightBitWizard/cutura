import { formatCHF } from "@cutura/core";
import { getDb } from "@cutura/db";

import { defaultLocale, isLocale } from "@/i18n/config";
import { getEnv } from "@/server/env";
import { priceConfigured } from "@/server/pricing";
import { rateLimit } from "@/server/ratelimit";

export const dynamic = "force-dynamic";

interface PriceRequest {
  handle?: string;
  locale?: string;
  fabricCode?: string | null;
  optionValueCodes?: string[];
  upgradeCodes?: string[];
}

// Server-authoritative live price for the configurator. The client debounces
// calls here; the returned `display`/`valid` always supersede any optimistic
// client value (FR-410/412).
export async function POST(request: Request): Promise<Response> {
  // Unauthenticated hot path: throttle per IP, generous enough for a session of
  // debounced configurator changes (comparable to the signal endpoint's budget).
  const env = getEnv();
  const ip = request.headers.get("cf-connecting-ip") ?? "anon";
  if (!(await rateLimit(env.RATE_LIMIT, `price:${ip}`, 120, 60))) {
    return Response.json({ error: "throttled" }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as PriceRequest | null;
  if (!body || typeof body.handle !== "string") {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const raw = body.locale ?? "";
  const locale = isLocale(raw) ? raw : defaultLocale;

  const priced = await priceConfigured(getDb(env.DB), body.handle, locale, {
    fabricCode: body.fabricCode ?? null,
    optionValueCodes: Array.isArray(body.optionValueCodes) ? body.optionValueCodes : [],
    upgradeCodes: Array.isArray(body.upgradeCodes) ? body.upgradeCodes : [],
  });
  if (!priced) return Response.json({ error: "not orderable" }, { status: 404 });

  return Response.json({
    ...priced.breakdown,
    display: formatCHF(priced.breakdown.total),
    valid: priced.valid,
    missingRequired: priced.missingRequired,
  });
}
