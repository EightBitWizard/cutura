import { deleteSessionById, getDb } from "@cutura/db";

import { defaultLocale } from "@/i18n/config";
import { clearedSessionCookie, destroyCustomerSession, readSessionCookie } from "@/server/auth";
import { getEnv } from "@/server/env";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const env = getEnv();
  const token = readSessionCookie(request.headers.get("cookie"));
  const sessionId = await destroyCustomerSession(token, env.SESSIONS, env.SESSION_SECRET);
  if (sessionId) await deleteSessionById(getDb(env.DB), sessionId);

  const headers = new Headers({
    Location: new URL(`/${defaultLocale}`, new URL(request.url).origin).toString(),
  });
  headers.append("Set-Cookie", clearedSessionCookie());
  return new Response(null, { status: 303, headers });
}
