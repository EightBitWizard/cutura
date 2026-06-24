import type { EmailMessage, EmailProvider } from "@cutura/core";

import type { Database } from "../getDb";
import { communicationLog } from "../schema";

export * from "./provider";
export * from "./templates";

/** Send an email and record the attempt in communication_log (FR-9B0). Never throws on send failure. */
export async function sendEmailAndLog(
  db: Database,
  provider: EmailProvider,
  message: EmailMessage,
  meta: { orderId?: string; template: string },
  deps: { now?: () => string; newId?: () => string } = {},
): Promise<{ status: "sent" | "failed" }> {
  const now = deps.now ?? (() => new Date().toISOString());
  const id = deps.newId ?? (() => crypto.randomUUID());
  let status: "sent" | "failed" = "sent";
  try {
    await provider.send(message);
  } catch {
    status = "failed";
  }
  await db.insert(communicationLog).values({
    id: id(),
    orderId: meta.orderId ?? null,
    channel: "email",
    template: meta.template,
    toAddress: message.to,
    status,
    createdAt: now(),
  });
  return { status };
}
