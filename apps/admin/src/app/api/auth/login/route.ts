import { type KVLike, createSession, sessionCookie, verifyAdminPassword } from "@/server/auth";
import { getEnv } from "@/server/env";
import { rateLimit } from "@/server/ratelimit";

export const dynamic = "force-dynamic";

function redirect(location: string, setCookie?: string): Response {
  const headers = new Headers({ Location: location });
  if (setCookie) headers.append("Set-Cookie", setCookie);
  return new Response(null, { status: 303, headers });
}

export async function POST(request: Request): Promise<Response> {
  const env = getEnv();
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  const allowed = await rateLimit(env.RATE_LIMIT as unknown as KVLike, `login:${ip}`, 10, 300);
  if (!allowed) return redirect("/login?error=rate");

  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  if (!(await verifyAdminPassword(password, env.ADMIN_AUTH_SECRET))) {
    return redirect("/login?error=1");
  }

  const token = await createSession(env.SESSIONS as unknown as KVLike, env.SESSION_SECRET);
  return redirect("/", sessionCookie(token));
}
