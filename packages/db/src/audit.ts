import { desc } from "drizzle-orm";

import type { Database } from "./getDb";
import { auditLog } from "./schema";

export type AuditLogRow = typeof auditLog.$inferSelect;

// Audit trail for admin operations, status changes, and sensitive access
// (REQUIREMENTS.md E2 US-2.7 FR-261; E10 US-10.7 FR-1050). Every admin mutation
// and every publish writes one row.

export interface AuditEntry {
  actor: string;
  action: string;
  entityType?: string;
  entityId?: string;
  detail?: unknown;
}

/** The audit trail newest-first for the admin audit view (FR-1050). */
export function listAuditLog(db: Database, limit = 200): Promise<AuditLogRow[]> {
  return db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(limit);
}

export async function writeAudit(db: Database, entry: AuditEntry): Promise<void> {
  await db.insert(auditLog).values({
    id: crypto.randomUUID(),
    actor: entry.actor,
    action: entry.action,
    entityType: entry.entityType ?? null,
    entityId: entry.entityId ?? null,
    detail: entry.detail ?? null,
    createdAt: new Date().toISOString(),
  });
}
