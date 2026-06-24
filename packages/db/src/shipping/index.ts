import { eq } from "drizzle-orm";

import type { Database } from "../getDb";
import { shippingMethod, shippingZone } from "../schema";

export type ShippingZoneRow = typeof shippingZone.$inferSelect;
export type ShippingMethodRow = typeof shippingMethod.$inferSelect;

const nowIso = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

export interface ShippingClock {
  now?: () => string;
  newId?: () => string;
}

export interface ZoneWithMethods {
  zone: ShippingZoneRow;
  methods: ShippingMethodRow[];
}

/** All shipping zones with their methods (FR-290). */
export async function listShipping(db: Database): Promise<ZoneWithMethods[]> {
  const zones = await db.select().from(shippingZone);
  const out: ZoneWithMethods[] = [];
  for (const zone of zones) {
    const methods = await db
      .select()
      .from(shippingMethod)
      .where(eq(shippingMethod.zoneId, zone.id));
    out.push({ zone, methods });
  }
  return out;
}

export async function saveShippingZone(
  db: Database,
  input: { id?: string; name: string; countries: string[] },
  deps: ShippingClock = {},
): Promise<{ id: string }> {
  const now = (deps.now ?? nowIso)();
  const id = input.id ?? (deps.newId ?? uuid)();
  await db
    .insert(shippingZone)
    .values({ id, name: input.name, countries: input.countries, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: shippingZone.id,
      set: { name: input.name, countries: input.countries, updatedAt: now },
    });
  return { id };
}

export async function saveShippingMethod(
  db: Database,
  input: {
    id?: string;
    zoneId: string;
    code: string;
    priceMinor: number;
    kind: "standard" | "express";
    includedInPrice: boolean;
  },
  deps: ShippingClock = {},
): Promise<{ id: string }> {
  const now = (deps.now ?? nowIso)();
  const id = input.id ?? (deps.newId ?? uuid)();
  const row = {
    zoneId: input.zoneId,
    code: input.code,
    priceMinor: input.priceMinor,
    kind: input.kind,
    includedInPrice: input.includedInPrice,
    updatedAt: now,
  };
  await db
    .insert(shippingMethod)
    .values({ id, ...row, createdAt: now })
    .onConflictDoUpdate({ target: shippingMethod.id, set: row });
  return { id };
}

/** The standard shipping method for the zone covering a country, or null if none configured. */
export async function getShippingForCountry(
  db: Database,
  country: string,
): Promise<{ zone: ShippingZoneRow; method: ShippingMethodRow } | null> {
  const zones = await db.select().from(shippingZone);
  const zone = zones.find((z) => Array.isArray(z.countries) && z.countries.includes(country));
  if (!zone) return null;
  const methods = await db.select().from(shippingMethod).where(eq(shippingMethod.zoneId, zone.id));
  const standard = methods.find((m) => m.kind === "standard") ?? methods[0];
  return standard ? { zone, method: standard } : null;
}
