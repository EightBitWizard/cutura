import type { EmailProvider } from "@cutura/core";

import { getOperationsSettings } from "../config";
import { renderContactNotification, sendEmailAndLog } from "../email";
import type { Database } from "../getDb";
import { contactMessage } from "../schema";

const nowIso = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

export interface ContactInput {
  name: string;
  email: string;
  message: string;
  locale: string;
}

/**
 * Store a contact-form submission and notify the admin (FR contact form). The
 * email goes to the configured operations admin email if set; the message is
 * always stored. Reuses sendEmailAndLog (never throws on send failure).
 */
export async function submitContactMessage(
  db: Database,
  provider: EmailProvider,
  input: ContactInput,
  deps: { now?: () => string; newId?: () => string } = {},
): Promise<{ id: string }> {
  const id = (deps.newId ?? uuid)();
  await db.insert(contactMessage).values({
    id,
    name: input.name,
    email: input.email,
    message: input.message,
    locale: input.locale,
    createdAt: (deps.now ?? nowIso)(),
  });
  const settings = await getOperationsSettings(db);
  if (settings.adminEmail) {
    await sendEmailAndLog(
      db,
      provider,
      renderContactNotification(settings.adminEmail, input),
      { template: "contact" },
      deps,
    );
  }
  return { id };
}
