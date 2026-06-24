import { desc, eq } from "drizzle-orm";

import { writeAudit } from "../audit";
import type { Database } from "../getDb";
import { supplier } from "../schema";

export type SupplierRow = typeof supplier.$inferSelect;

const nowIso = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

export interface SupplierClock {
  now?: () => string;
  newId?: () => string;
}

/** Suppliers, default first. Lives in the environment DB (routing reads it at paid). */
export function listSuppliers(db: Database): Promise<SupplierRow[]> {
  return db.select().from(supplier).orderBy(desc(supplier.isDefault));
}

export async function getSupplier(db: Database, id: string): Promise<SupplierRow | undefined> {
  const [row] = await db.select().from(supplier).where(eq(supplier.id, id));
  return row;
}

export interface SupplierInput {
  id?: string;
  name: string;
  contact?: unknown;
  capabilities?: unknown;
  notes?: string | null;
  isDefault?: boolean;
}

export async function upsertSupplier(
  db: Database,
  input: SupplierInput,
  actor: string,
  deps: SupplierClock = {},
): Promise<{ id: string }> {
  const now = (deps.now ?? nowIso)();
  const existing = input.id ? await getSupplier(db, input.id) : undefined;
  const id = existing?.id ?? input.id ?? (deps.newId ?? uuid)();

  // Single default (FR-2A1): clear all before setting this one.
  if (input.isDefault) await db.update(supplier).set({ isDefault: false, updatedAt: now });

  if (existing) {
    await db
      .update(supplier)
      .set({
        name: input.name,
        contact: input.contact ?? existing.contact,
        capabilities: input.capabilities ?? existing.capabilities,
        notes: input.notes ?? null,
        isDefault: input.isDefault ?? existing.isDefault,
        updatedAt: now,
      })
      .where(eq(supplier.id, id));
  } else {
    await db.insert(supplier).values({
      id,
      name: input.name,
      contact: input.contact ?? null,
      capabilities: input.capabilities ?? null,
      notes: input.notes ?? null,
      isDefault: input.isDefault ?? false,
      createdAt: now,
      updatedAt: now,
    });
  }
  await writeAudit(db, {
    actor,
    action: existing ? "supplier.update" : "supplier.create",
    entityType: "supplier",
    entityId: id,
  });
  return { id };
}

export async function setDefaultSupplier(
  db: Database,
  id: string,
  actor: string,
  deps: SupplierClock = {},
): Promise<boolean> {
  if (!(await getSupplier(db, id))) return false;
  const now = (deps.now ?? nowIso)();
  await db.update(supplier).set({ isDefault: false, updatedAt: now });
  await db.update(supplier).set({ isDefault: true, updatedAt: now }).where(eq(supplier.id, id));
  await writeAudit(db, {
    actor,
    action: "supplier.set_default",
    entityType: "supplier",
    entityId: id,
  });
  return true;
}
