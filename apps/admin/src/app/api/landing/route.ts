import { setLandingConfig } from "@cutura/db";
import type { LandingText } from "@cutura/core";

import { environmentDb, parseEnvironment } from "@/server/catalog";
import { localizedFromForm, safePath, seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

const FIELDS = [
  "heroHeadline",
  "heroLead",
  "fabricTitle",
  "fabricBody",
  "trustTitle",
  "trustBody",
] as const;

// Env-direct write of the landing-page editorial text (immediate, no publish step),
// like the operations settings. Empty fields are omitted so the storefront falls back
// to its i18n defaults.
export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const environment = parseEnvironment(form.get("environment"));

  const landing: Partial<Record<(typeof FIELDS)[number], LandingText>> = {};
  for (const field of FIELDS) {
    const loc = localizedFromForm(form, field);
    if (Object.values(loc).some((v) => typeof v === "string" && v.trim() !== "")) {
      landing[field] = loc;
    }
  }

  await setLandingConfig(environmentDb(environment), landing);
  return seeOther(safePath(`/landing?env=${environment}&saved=1`, "/landing"));
}
