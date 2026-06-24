// Email provider boundary (pure types). The concrete Resend client + the
// localized templates + communication-log writes live in packages/db/email; tests
// use a fake provider. Keeps the transactional-email seam swappable (FR-9A0).

export type EmailLocale = "de" | "en" | "it" | "fr";

export interface EmailAttachment {
  filename: string;
  /** Base64-encoded content (e.g. a supplier PDF). */
  contentBase64: string;
  contentType: string;
}

export interface EmailMessage {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<{ id: string; status: "sent" }>;
}
