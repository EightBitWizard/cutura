import { createRedirect } from "@cutura/db";

import { environmentDb } from "@/server/catalog";
import { seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const fromPath = String(form.get("fromPath") ?? "").trim();
  const toPath = String(form.get("toPath") ?? "").trim();
  if (!fromPath.startsWith("/") || !toPath.startsWith("/")) {
    return seeOther("/redirects?error=path");
  }
  await createRedirect(environmentDb("staging"), {
    fromPath,
    toPath,
    code: form.get("code") === "302" ? 302 : 301,
  });
  return seeOther("/redirects?saved=1");
}
