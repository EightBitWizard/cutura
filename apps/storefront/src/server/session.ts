import { cookies } from "next/headers";

import { SESSION_COOKIE, verifyCustomerSession } from "./auth";
import { getEnv } from "./env";

/** The authenticated customer id from the session cookie, or null. For account routes/pages. */
export async function getCustomerId(): Promise<string | null> {
  const env = getEnv();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const res = await verifyCustomerSession(token, env.SESSIONS, env.SESSION_SECRET);
  return res?.customerId ?? null;
}
