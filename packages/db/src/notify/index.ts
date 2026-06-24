import type { Database } from "../getDb";
import { notifyRequest } from "../schema";

const nowIso = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

export interface NotifyRequestInput {
  email: string;
  entityType: string;
  entityId: string;
  locale: string;
}

/** Record a notify-me request for an unavailable item (FR-361). */
export async function recordNotifyRequest(
  db: Database,
  input: NotifyRequestInput,
  deps: { now?: () => string; newId?: () => string } = {},
): Promise<{ id: string }> {
  const id = (deps.newId ?? uuid)();
  await db.insert(notifyRequest).values({
    id,
    email: input.email,
    entityType: input.entityType,
    entityId: input.entityId,
    locale: input.locale,
    notifiedAt: null,
    createdAt: (deps.now ?? nowIso)(),
  });
  return { id };
}
