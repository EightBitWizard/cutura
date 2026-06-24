import type { Database } from "./getDb";
import { auditLog } from "./schema";

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
