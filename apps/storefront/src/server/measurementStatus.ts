import { cookies } from "next/headers";

import { getDb, getProfileIdForGarmentType } from "@cutura/db";

import { getEnv } from "./env";
import { MEASURE_COOKIE, readMeasurementVersion } from "./measurement";
import { getCustomerId } from "./session";

/**
 * Which of the given garment types the current visitor has a measurement for
 * (a customer profile of that type, or a guest KV measurement). Measurements are
 * per garment type, so a shirt-and-trousers cart needs one of each.
 */
export async function measuredGarmentTypes(garmentTypes: string[]): Promise<Set<string>> {
  const out = new Set<string>();
  if (garmentTypes.length === 0) return out;

  const customerId = await getCustomerId();
  const db = getDb(getEnv().DB);
  const cookieStore = await cookies();
  const token = cookieStore.get(MEASURE_COOKIE)?.value;

  for (const gt of new Set(garmentTypes)) {
    if (customerId && (await getProfileIdForGarmentType(db, customerId, gt))) {
      out.add(gt);
      continue;
    }
    if (token && (await readMeasurementVersion(token, gt))) out.add(gt);
  }
  return out;
}
