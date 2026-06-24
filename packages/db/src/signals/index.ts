import type { Database } from "../getDb";
import { recommendationSignal } from "../schema";

const nowIso = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

export type SignalType = "view" | "search" | "cart_add" | "impression";

export interface SignalInput {
  customerId?: string | null;
  sessionId: string;
  signalType: SignalType;
  entityType: string;
  entityId: string;
}

/**
 * Append a recommendation signal (FR-1120). The caller must already have checked
 * analytics consent (hasAnalyticsConsent) - this layer just records. Append-only;
 * never holds measurements or order contents; deleted with the customer (FR-1142).
 */
export async function captureSignal(
  db: Database,
  input: SignalInput,
  deps: { now?: () => string; newId?: () => string } = {},
): Promise<{ id: string }> {
  const id = (deps.newId ?? uuid)();
  await db.insert(recommendationSignal).values({
    id,
    customerId: input.customerId ?? null,
    sessionId: input.sessionId,
    signalType: input.signalType,
    entityType: input.entityType,
    entityId: input.entityId,
    createdAt: (deps.now ?? nowIso)(),
  });
  return { id };
}
