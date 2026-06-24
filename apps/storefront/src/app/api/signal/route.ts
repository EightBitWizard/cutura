import { CONSENT_COOKIE, hasAnalyticsConsent, randomToken } from "@cutura/core";
import { type SignalType, captureSignal, getDb } from "@cutura/db";

import { getEnv } from "@/server/env";
import { rateLimit } from "@/server/ratelimit";
import { getCustomerId } from "@/server/session";

export const dynamic = "force-dynamic";

const SID_COOKIE = "cutura_sid";
const VALID: SignalType[] = ["view", "search", "cart_add", "impression"];

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=") || undefined;
  }
  return undefined;
}

// Consent-gated recommendation-signal capture (FR-1120). Records nothing without
// analytics consent; never receives measurements or order contents.
export async function POST(request: Request): Promise<Response> {
  if (!hasAnalyticsConsent(readCookie(request, CONSENT_COOKIE))) {
    return new Response(null, { status: 204 });
  }
  const body = (await request.json().catch(() => null)) as {
    signalType?: string;
    entityType?: string;
    entityId?: string;
  } | null;
  const signalType = body?.signalType as SignalType | undefined;
  if (!body?.entityId || !signalType || !VALID.includes(signalType)) {
    return new Response(null, { status: 204 });
  }

  const env = getEnv();
  const ip = request.headers.get("cf-connecting-ip") ?? "anon";
  if (!(await rateLimit(env.RATE_LIMIT, `signal:${ip}`, 120, 60))) {
    return new Response(null, { status: 204 });
  }

  const customerId = await getCustomerId();
  let sid = readCookie(request, SID_COOKIE);
  const isNew = !sid;
  if (!sid) sid = randomToken(16);

  await captureSignal(getDb(env.DB), {
    customerId,
    sessionId: customerId ?? sid,
    signalType,
    entityType: "model", // only models are signalled at launch
    entityId: body.entityId,
  });

  const headers = new Headers();
  if (isNew) {
    headers.append(
      "set-cookie",
      `${SID_COOKIE}=${sid}; Path=/; SameSite=Lax; Secure; Max-Age=${60 * 60 * 24 * 180}`,
    );
  }
  return new Response(null, { status: 204, headers });
}
