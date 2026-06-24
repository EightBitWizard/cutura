import { and, eq } from "drizzle-orm";

import type { Database } from "../getDb";
import { address } from "../schema";
import type { CustomerClock } from "./auth";

export type AddressRow = typeof address.$inferSelect;

const nowIso = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

export interface AddressInput {
  line1: string;
  line2?: string | null;
  city: string;
  zip: string;
  country: "CH" | "LI";
  isDefault?: boolean;
}

export function listAddresses(db: Database, customerId: string): Promise<AddressRow[]> {
  return db.select().from(address).where(eq(address.customerId, customerId));
}

/** The customer's default address (or the first), for checkout prefill. */
export async function getDefaultAddress(
  db: Database,
  customerId: string,
): Promise<AddressRow | undefined> {
  const rows = await listAddresses(db, customerId);
  return rows.find((a) => a.isDefault) ?? rows[0];
}

async function clearDefaults(db: Database, customerId: string, now: string): Promise<void> {
  await db
    .update(address)
    .set({ isDefault: false, updatedAt: now })
    .where(eq(address.customerId, customerId));
}

export async function createAddress(
  db: Database,
  customerId: string,
  input: AddressInput,
  deps: CustomerClock = {},
): Promise<{ id: string }> {
  const now = (deps.now ?? nowIso)();
  const id = (deps.newId ?? uuid)();
  if (input.isDefault) await clearDefaults(db, customerId, now);
  await db.insert(address).values({
    id,
    customerId,
    line1: input.line1,
    line2: input.line2 ?? null,
    city: input.city,
    zip: input.zip,
    country: input.country,
    isDefault: input.isDefault ?? false,
    createdAt: now,
    updatedAt: now,
  });
  return { id };
}

async function ownsAddress(db: Database, customerId: string, addressId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: address.id })
    .from(address)
    .where(and(eq(address.id, addressId), eq(address.customerId, customerId)));
  return Boolean(row);
}

export async function updateAddress(
  db: Database,
  customerId: string,
  addressId: string,
  input: AddressInput,
): Promise<boolean> {
  if (!(await ownsAddress(db, customerId, addressId))) return false;
  const now = nowIso();
  if (input.isDefault) await clearDefaults(db, customerId, now);
  await db
    .update(address)
    .set({
      line1: input.line1,
      line2: input.line2 ?? null,
      city: input.city,
      zip: input.zip,
      country: input.country,
      isDefault: input.isDefault ?? false,
      updatedAt: now,
    })
    .where(eq(address.id, addressId));
  return true;
}

export async function deleteAddress(
  db: Database,
  customerId: string,
  addressId: string,
): Promise<boolean> {
  if (!(await ownsAddress(db, customerId, addressId))) return false;
  await db.delete(address).where(eq(address.id, addressId));
  return true;
}

export async function setDefaultAddress(
  db: Database,
  customerId: string,
  addressId: string,
): Promise<boolean> {
  if (!(await ownsAddress(db, customerId, addressId))) return false;
  const now = nowIso();
  await clearDefaults(db, customerId, now);
  await db
    .update(address)
    .set({ isDefault: true, updatedAt: now })
    .where(eq(address.id, addressId));
  return true;
}
