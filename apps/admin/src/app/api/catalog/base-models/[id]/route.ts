import {
  baseModel,
  getRow,
  saveRow,
  setModelAllowedFabrics,
  setModelAllowedOptions,
  setModelAllowedUpgrades,
  writeAudit,
} from "@cutura/db";

import { controlDb } from "@/server/catalog";
import { localizedFromForm, seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

function parseStatus(value: FormDataEntryValue | null): "draft" | "view_only" | "orderable" {
  return value === "orderable" ? "orderable" : value === "view_only" ? "view_only" : "draft";
}

// The price in Rappen must be an explicit non-negative integer. Anything else
// (empty, negative, fractional, non-numeric) is rejected; never silently store 0.
function parsePriceMinor(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) ? n : null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const db = controlDb();
  const existing = await getRow(db, baseModel, id);
  if (!existing) return seeOther("/base-models?error=notfound");

  const form = await request.formData();
  const basePriceMinor = parsePriceMinor(form.get("basePriceMinor"));
  if (basePriceMinor === null) return seeOther(`/base-models/${id}?error=invalid_price`);
  await saveRow(db, baseModel, {
    ...existing,
    handle: String(form.get("handle") ?? existing.handle).trim() || existing.handle,
    nameI18n: localizedFromForm(form, "name"),
    descriptionI18n: localizedFromForm(form, "description"),
    basePriceMinor,
    leadTimeMinDays: Number(form.get("leadTimeMinDays") ?? existing.leadTimeMinDays) || 1,
    leadTimeMaxDays: Number(form.get("leadTimeMaxDays") ?? existing.leadTimeMaxDays) || 1,
    status: parseStatus(form.get("status")),
    updatedAt: new Date().toISOString(),
  });

  const fabricIds = form.getAll("fabric").map(String);
  const upgradeIds = form.getAll("upgrade").map(String);
  const options = form
    .getAll("option")
    .map(String)
    .map((optionGroupId) => ({
      optionGroupId,
      required: form.get(`required_${optionGroupId}`) === "on",
    }));
  await setModelAllowedFabrics(db, id, fabricIds);
  await setModelAllowedOptions(db, id, options);
  await setModelAllowedUpgrades(db, id, upgradeIds);

  await writeAudit(db, {
    actor: "admin",
    action: "catalog.baseModel.update",
    entityType: "baseModel",
    entityId: id,
  });
  return seeOther(`/base-models/${id}?saved=1`);
}
