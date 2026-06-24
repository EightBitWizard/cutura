import { eq } from "drizzle-orm";

import { writeAudit } from "../audit";
import type { Database } from "../getDb";
import { customer, session } from "../schema";

export type CustomerRow = typeof customer.$inferSelect;

export interface CustomerClock {
  now?: () => string;
  newId?: () => string;
}
const nowIso = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function findCustomerByEmail(
  db: Database,
  email: string,
): Promise<CustomerRow | undefined> {
  const [row] = await db
    .select()
    .from(customer)
    .where(eq(customer.email, normalizeEmail(email)));
  return row;
}

export interface FindOrCreateResult {
  customer: CustomerRow;
  created: boolean;
}

/** Find a customer by (normalized) email, or create an active one. */
export async function findOrCreateCustomer(
  db: Database,
  email: string,
  locale: string,
  deps: CustomerClock = {},
): Promise<FindOrCreateResult> {
  const existing = await findCustomerByEmail(db, email);
  if (existing) return { customer: existing, created: false };

  const now = deps.now ?? nowIso;
  const id = (deps.newId ?? uuid)();
  const row: CustomerRow = {
    id,
    email: normalizeEmail(email),
    locale,
    marketingConsent: false,
    deletionState: "active",
    createdAt: now(),
    updatedAt: now(),
  };
  await db.insert(customer).values(row);
  await writeAudit(db, {
    actor: `customer:${id}`,
    action: "customer.created",
    entityType: "customer",
    entityId: id,
  });
  return { customer: row, created: true };
}

// --- D1 session mirror (KV is the request-path authority; these power deletion enumeration) ---

export async function recordSession(
  db: Database,
  input: { id: string; customerId: string; expiresAt: string },
  deps: CustomerClock = {},
): Promise<void> {
  await db.insert(session).values({
    id: input.id,
    customerId: input.customerId,
    expiresAt: input.expiresAt,
    createdAt: (deps.now ?? nowIso)(),
  });
}

export async function deleteSessionById(db: Database, id: string): Promise<void> {
  await db.delete(session).where(eq(session.id, id));
}

export async function listSessionIdsForCustomer(
  db: Database,
  customerId: string,
): Promise<string[]> {
  const rows = await db.select().from(session).where(eq(session.customerId, customerId));
  return rows.map((r) => r.id);
}

export async function deleteSessionsForCustomer(db: Database, customerId: string): Promise<void> {
  await db.delete(session).where(eq(session.customerId, customerId));
}
