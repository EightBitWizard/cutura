import { desc, eq, inArray } from "drizzle-orm";

import { type GarmentMeasurements, decryptJson } from "@cutura/core";

import { writeAudit } from "../audit";
import type { Database } from "../getDb";
import { customer, fitReview, measurementProfile, measurementVersion, order } from "../schema";

const nowIso = () => new Date().toISOString();

export interface CustomerListRow {
  id: string;
  email: string;
  locale: string;
  deletionState: string;
  orderCount: number;
  tags: string[] | null;
  createdAt: string;
}

/** All customers newest-first for the back-office list (no body data). */
export async function listCustomersAdmin(db: Database): Promise<CustomerListRow[]> {
  const customers = await db.select().from(customer).orderBy(desc(customer.createdAt));
  const result: CustomerListRow[] = [];
  for (const c of customers) {
    const orders = await db.select({ id: order.id }).from(order).where(eq(order.customerId, c.id));
    result.push({
      id: c.id,
      email: c.email,
      locale: c.locale,
      deletionState: c.deletionState,
      orderCount: orders.length,
      tags: c.tags,
      createdAt: c.createdAt,
    });
  }
  return result;
}

export interface CustomerAdminView {
  customer: typeof customer.$inferSelect;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalMinor: number;
    notes: string | null;
    tags: string[] | null;
    createdAt: string;
  }>;
  profiles: Array<{ id: string; name: string | null; confirmed: GarmentMeasurements | null }>;
  fitReviews: Array<{
    id: string;
    orderId: string;
    reason: string;
    status: string;
    decision: string | null;
    createdAt: string;
  }>;
}

/**
 * Full back-office customer view (FR-1070): profile, orders, and fit history.
 * Viewing decrypts body measurements, so this writes a sensitive-access audit row
 * (FR-1050). Returns null if the customer does not exist.
 */
export async function getCustomerAdminView(
  db: Database,
  customerId: string,
  key: string,
  actor = "admin",
): Promise<CustomerAdminView | null> {
  const [c] = await db.select().from(customer).where(eq(customer.id, customerId));
  if (!c) return null;
  await writeAudit(db, {
    actor,
    action: "customer.view",
    entityType: "customer",
    entityId: customerId,
  });

  const orderRows = await db
    .select()
    .from(order)
    .where(eq(order.customerId, customerId))
    .orderBy(desc(order.createdAt));

  const profileRows = await db
    .select()
    .from(measurementProfile)
    .where(eq(measurementProfile.customerId, customerId));
  const profiles: CustomerAdminView["profiles"] = [];
  for (const p of profileRows) {
    const [v] = await db
      .select({ enc: measurementVersion.confirmedValuesEnc })
      .from(measurementVersion)
      .where(eq(measurementVersion.profileId, p.id))
      .orderBy(desc(measurementVersion.version));
    let confirmed: GarmentMeasurements | null = null;
    if (v?.enc) {
      try {
        confirmed = await decryptJson<GarmentMeasurements>(v.enc, key, "measurement_version");
      } catch {
        confirmed = null;
      }
    }
    profiles.push({ id: p.id, name: p.name, confirmed });
  }

  const frRows = orderRows.length
    ? await db
        .select()
        .from(fitReview)
        .where(
          inArray(
            fitReview.orderId,
            orderRows.map((o) => o.id),
          ),
        )
    : [];

  return {
    customer: c,
    orders: orderRows.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      totalMinor: o.totalMinor,
      notes: o.notes,
      tags: o.tags,
      createdAt: o.createdAt,
    })),
    profiles,
    fitReviews: frRows.map((f) => ({
      id: f.id,
      orderId: f.orderId,
      reason: f.reason,
      status: f.status,
      decision: f.decision,
      createdAt: f.createdAt,
    })),
  };
}

export interface NotesTags {
  notes?: string | null;
  tags?: string[] | null;
}

export async function setOrderNotesTags(
  db: Database,
  orderId: string,
  input: NotesTags,
  actor: string,
  deps: { now?: () => string } = {},
): Promise<void> {
  const now = (deps.now ?? nowIso)();
  await db
    .update(order)
    .set({ notes: input.notes ?? null, tags: input.tags ?? null, updatedAt: now })
    .where(eq(order.id, orderId));
  await writeAudit(db, {
    actor,
    action: "order.notes_tags",
    entityType: "order",
    entityId: orderId,
  });
}

export async function setCustomerNotesTags(
  db: Database,
  customerId: string,
  input: NotesTags,
  actor: string,
  deps: { now?: () => string } = {},
): Promise<void> {
  const now = (deps.now ?? nowIso)();
  await db
    .update(customer)
    .set({ notes: input.notes ?? null, tags: input.tags ?? null, updatedAt: now })
    .where(eq(customer.id, customerId));
  await writeAudit(db, {
    actor,
    action: "customer.notes_tags",
    entityType: "customer",
    entityId: customerId,
  });
}
