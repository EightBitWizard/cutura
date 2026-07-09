import { GARMENT_TYPES } from "@cutura/core";
import {
  claimGuestOrders,
  findOrCreateCustomer,
  getDb,
  migrateGuestMeasurement,
  recordSession,
} from "@cutura/db";

import { defaultLocale, isLocale } from "@/i18n/config";
import { consumeMagicLink, createCustomerSession, sessionCookie } from "@/server/auth";
import { getEnv } from "@/server/env";
import {
  clearMeasurement,
  clearedMeasureCookie,
  readMeasureToken,
  readMeasurementVersion,
} from "@/server/measurement";
import { rateLimit } from "@/server/ratelimit";

export const dynamic = "force-dynamic";

// Consume a magic-link token and issue a customer session, then redirect into the
// account area. Single-use is enforced by consumeMagicLink (get-then-delete).
export async function POST(request: Request): Promise<Response> {
  return handle(request);
}
export async function GET(request: Request): Promise<Response> {
  return handle(request);
}

async function handle(request: Request): Promise<Response> {
  const env = getEnv();
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const localeParam = url.searchParams.get("locale") ?? "";
  const locale = isLocale(localeParam) ? localeParam : defaultLocale;
  const redirect = (path: string, cookies: string[] = []): Response => {
    const headers = new Headers({ Location: new URL(path, url.origin).toString() });
    for (const c of cookies) headers.append("Set-Cookie", c);
    return new Response(null, { status: 303, headers });
  };

  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  if (!(await rateLimit(env.SESSIONS, `magiclink-verify:ip:${ip}`, 30, 3600))) {
    return redirect(`/${locale}/account/login?error=throttled`);
  }
  if (!token) return redirect(`/${locale}/account/login?error=expired`);

  const payload = await consumeMagicLink(env.SESSIONS, token);
  if (!payload) return redirect(`/${locale}/account/login?error=expired`);

  const db = getDb(env.DB);
  const { customer } = await findOrCreateCustomer(db, payload.email, payload.locale);
  // Tombstoned (deleted / deletion-requested) emails cannot log back in.
  if (customer.deletionState !== "active") {
    return redirect(`/${locale}/account/login?error=disabled`);
  }

  // Claim prior guest orders + migrate the guest measurement into the account
  // (best-effort: login still proceeds if either fails).
  let clearMeasure = false;
  try {
    await claimGuestOrders(db, customer.id, payload.email);
    const measureToken = readMeasureToken(request.headers.get("cookie"));
    if (measureToken) {
      // Migrate each garment type the guest measured into its own profile.
      for (const garmentType of GARMENT_TYPES) {
        const version = await readMeasurementVersion(measureToken, garmentType);
        if (!version) continue;
        const migrated = await migrateGuestMeasurement(
          db,
          customer.id,
          version,
          env.MEASUREMENT_ENCRYPTION_KEY,
        );
        if (migrated) {
          await clearMeasurement(measureToken, garmentType);
          clearMeasure = true;
        }
      }
    }
  } catch {
    // best-effort
  }

  const sess = await createCustomerSession(env.SESSIONS, env.SESSION_SECRET, customer.id);
  await recordSession(db, {
    id: sess.sessionId,
    customerId: customer.id,
    expiresAt: new Date(sess.expiresAtSeconds * 1000).toISOString(),
  });
  const cookies = [sessionCookie(sess.token)];
  if (clearMeasure) cookies.push(clearedMeasureCookie());
  return redirect(`/${customer.locale}/account`, cookies);
}
