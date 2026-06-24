import type { GarmentMeasurements } from "@cutura/core";
import { archiveProfile, getDb, renameProfile, reviseProfile } from "@cutura/db";

import { defaultLocale, isLocale } from "@/i18n/config";
import { getEnv } from "@/server/env";
import { redirectTo } from "@/server/http";
import { getCustomerId } from "@/server/session";

export const dynamic = "force-dynamic";

const FIELDS = ["chest", "waist", "hips", "neck", "shoulder", "sleeveLength", "shirtLength"];

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const rawLocale = String(form.get("locale") ?? "");
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  const customerId = await getCustomerId();
  if (!customerId) return redirectTo(request, `/${locale}/account/login`);

  const profileId = String(form.get("profileId") ?? "");
  const action = String(form.get("action") ?? "");
  const env = getEnv();
  const db = getDb(env.DB);

  if (action === "rename") {
    await renameProfile(db, customerId, profileId, String(form.get("name") ?? "").trim());
  } else if (action === "archive") {
    await archiveProfile(db, customerId, profileId);
  } else if (action === "revise") {
    const changes: Record<string, number> = {};
    for (const f of FIELDS) {
      const v = Number.parseFloat(String(form.get(f) ?? ""));
      if (!Number.isNaN(v) && v > 0) changes[f] = v;
    }
    await reviseProfile(
      db,
      customerId,
      profileId,
      changes as Partial<GarmentMeasurements>,
      env.MEASUREMENT_ENCRYPTION_KEY,
    );
  }
  return redirectTo(request, `/${locale}/account/profile`);
}
