import { createAddress, deleteAddress, getDb, setDefaultAddress, updateAddress } from "@cutura/db";

import { defaultLocale, isLocale } from "@/i18n/config";
import { getEnv } from "@/server/env";
import { redirectTo } from "@/server/http";
import { getCustomerId } from "@/server/session";

export const dynamic = "force-dynamic";

function parseAddress(form: FormData) {
  return {
    line1: String(form.get("line1") ?? "").trim(),
    line2: String(form.get("line2") ?? "").trim() || null,
    city: String(form.get("city") ?? "").trim(),
    zip: String(form.get("zip") ?? "").trim(),
    country: form.get("country") === "LI" ? ("LI" as const) : ("CH" as const),
    isDefault: form.get("isDefault") === "on",
  };
}

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const rawLocale = String(form.get("locale") ?? "");
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const customerId = await getCustomerId();
  if (!customerId) return redirectTo(request, `/${locale}/account/login`);

  const action = String(form.get("action") ?? "");
  const addressId = String(form.get("addressId") ?? "");
  const db = getDb(getEnv().DB);

  if (action === "create") {
    const a = parseAddress(form);
    if (a.line1 && a.city && a.zip) await createAddress(db, customerId, a);
  } else if (action === "update") {
    await updateAddress(db, customerId, addressId, parseAddress(form));
  } else if (action === "delete") {
    await deleteAddress(db, customerId, addressId);
  } else if (action === "default") {
    await setDefaultAddress(db, customerId, addressId);
  }
  return redirectTo(request, `/${locale}/account/addresses`);
}
