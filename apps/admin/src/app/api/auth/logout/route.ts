import {
  type KVLike,
  clearedSessionCookie,
  destroySession,
  readSessionCookie,
} from "@/server/auth";
import { getEnv } from "@/server/env";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const env = getEnv();
  const token = readSessionCookie(request.headers.get("cookie"));
  await destroySession(token, env.SESSIONS as unknown as KVLike, env.SESSION_SECRET);
  const headers = new Headers({ Location: "/login" });
  headers.append("Set-Cookie", clearedSessionCookie());
  return new Response(null, { status: 303, headers });
}
