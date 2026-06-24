import {
  deleteCustomerData,
  exportCustomerData,
  getDb,
  listSessionIdsForCustomer,
} from "@cutura/db";

import { defaultLocale, isLocale } from "@/i18n/config";
import { clearedSessionCookie, deleteSessionKv } from "@/server/auth";
import { getEnv } from "@/server/env";
import { redirectTo } from "@/server/http";
import { getCustomerId } from "@/server/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const rawLocale = String(form.get("locale") ?? "");
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const customerId = await getCustomerId();
  if (!customerId) return redirectTo(request, `/${locale}/account/login`);

  const env = getEnv();
  const db = getDb(env.DB);
  const action = String(form.get("action") ?? "");

  if (action === "export") {
    const data = await exportCustomerData(db, customerId, env.MEASUREMENT_ENCRYPTION_KEY);
    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "content-type": "application/json",
        "content-disposition": 'attachment; filename="cutura-data.json"',
      },
    });
  }

  if (action === "delete") {
    // Revoke live KV sessions, then erase D1 + R2 (FR-670/671), then log out.
    for (const id of await listSessionIdsForCustomer(db, customerId)) {
      await deleteSessionKv(env.SESSIONS, id);
    }
    await deleteCustomerData(db, customerId, env.MEDIA);
    return redirectTo(request, `/${locale}`, { "Set-Cookie": clearedSessionCookie() });
  }

  return redirectTo(request, `/${locale}/account/privacy`);
}
