import { getOperationsSettings, setOperationsSettings } from "@cutura/db";

import { environmentDb, parseEnvironment } from "@/server/catalog";
import { safePath, seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

function num(form: FormData, key: string, fallback: number): number {
  const v = form.get(key);
  if (v === null || String(v).trim() === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const environment = parseEnvironment(form.get("environment"));
  const db = environmentDb(environment);
  const current = await getOperationsSettings(db);

  const capRaw = form.get("capacityCap");
  const capacityCap =
    capRaw === null || String(capRaw).trim() === ""
      ? null
      : Math.max(0, Math.trunc(Number(capRaw) || 0));

  await setOperationsSettings(db, {
    capacityCap,
    paused: form.get("paused") === "on",
    pauseMessage: {
      de: String(form.get("pauseDe") ?? "").trim(),
      en: String(form.get("pauseEn") ?? "").trim() || undefined,
      it: String(form.get("pauseIt") ?? "").trim() || undefined,
      fr: String(form.get("pauseFr") ?? "").trim() || undefined,
    },
    vacationFrom: String(form.get("vacationFrom") ?? "").trim() || null,
    vacationUntil: String(form.get("vacationUntil") ?? "").trim() || null,
    leadTimeBufferDays: Math.max(
      0,
      Math.trunc(num(form, "leadTimeBufferDays", current.leadTimeBufferDays)),
    ),
    capacityHighWaterFraction: Math.min(
      1,
      Math.max(0, num(form, "capacityHighWaterFraction", current.capacityHighWaterFraction)),
    ),
  });

  return seeOther(safePath(`/settings?env=${environment}&saved=1`, "/settings"));
}
