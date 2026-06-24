import type { EmailMessage, EmailProvider } from "@cutura/core";

import { getOperationsSettings } from "../config";
import type { Database } from "../getDb";
import { communicationLog } from "../schema";
import { type AdminNotificationKind, renderAdminNotification } from "./templates";

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

/**
 * Send an admin notification (FR-950) to the configured admin email, if any.
 * No-op (returns "skipped") when no admin email is configured.
 */
export async function notifyAdmin(
  db: Database,
  provider: EmailProvider,
  kind: AdminNotificationKind,
  meta: { orderId?: string; orderNumber: string },
  deps: { now?: () => string; newId?: () => string } = {},
): Promise<{ status: "sent" | "failed" | "skipped" }> {
  const settings = await getOperationsSettings(db);
  if (!settings.adminEmail) return { status: "skipped" };
  const message = renderAdminNotification(kind, {
    to: settings.adminEmail,
    orderNumber: meta.orderNumber,
  });
  return sendEmailAndLog(
    db,
    provider,
    message,
    { orderId: meta.orderId, template: `admin_${kind}` },
    deps,
  );
}
