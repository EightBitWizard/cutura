import { createCrossSellRule } from "@cutura/db";

import { controlDb } from "@/server/catalog";
import { seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const sourceType = form.get("sourceType") === "attribute" ? "attribute" : "model";
  const sourceKey = String(form.get("sourceKey") ?? "").trim();
  const suggestedModelId = String(form.get("suggestedModelId") ?? "").trim();
  if (!sourceKey || !suggestedModelId) return seeOther("/cross-sell?error=required");
  await createCrossSellRule(controlDb(), {
    sourceType,
    sourceKey,
    suggestedModelId,
    position: Math.max(0, Math.trunc(Number(form.get("position")) || 0)),
  });
  return seeOther("/cross-sell?saved=1");
}
