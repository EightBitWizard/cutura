import type { EmailMessage, EmailProvider } from "@cutura/core";

const DEFAULT_FROM = "CUTURA <orders@cutura.ch>";

/** Resend transactional-email client (fetch-based; no SDK dependency on Workers). */
export class ResendEmailProvider implements EmailProvider {
  constructor(
    private readonly apiKey: string,
    private readonly from: string = DEFAULT_FROM,
  ) {}

  async send(message: EmailMessage): Promise<{ id: string; status: "sent" }> {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        from: message.from || this.from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        reply_to: message.replyTo,
        attachments: message.attachments?.map((a) => ({
          filename: a.filename,
          content: a.contentBase64,
        })),
      }),
    });
    if (!res.ok) throw new Error(`Resend HTTP ${res.status}`);
    const json = (await res.json()) as { id?: string };
    return { id: json.id ?? "", status: "sent" };
  }
}

/** In-memory provider for tests (records messages; no network). */
export class FakeEmailProvider implements EmailProvider {
  public readonly sent: EmailMessage[] = [];
  async send(message: EmailMessage): Promise<{ id: string; status: "sent" }> {
    this.sent.push(message);
    return { id: `fake_${this.sent.length}`, status: "sent" };
  }
}
