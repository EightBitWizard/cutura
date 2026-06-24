import { describe, expect, it } from "vitest";

import type { EmailLocale } from "@cutura/core";

import { FakeEmailProvider, renderOrderConfirmation, renderShippedEmail } from "./index";

describe("email templates", () => {
  const base = { to: "a@example.com", orderNumber: "CUT-ABC123", totalMinor: 12900 };

  it("localizes the order confirmation", () => {
    expect(renderOrderConfirmation(base, "de").subject).toContain("CUT-ABC123");
    expect(renderOrderConfirmation(base, "en").html).toContain("Thank you");
    expect(renderOrderConfirmation(base, "fr").html).toContain("Merci");
    expect(renderOrderConfirmation(base, "it").html).toContain("Grazie");
    expect(renderOrderConfirmation(base, "de").html).toContain("CHF 129.00");
  });

  it("falls back to German for an unknown locale", () => {
    const msg = renderOrderConfirmation(base, "xx" as unknown as EmailLocale);
    expect(msg.html).toContain("Vielen Dank");
  });

  it("FakeEmailProvider records sends", async () => {
    const provider = new FakeEmailProvider();
    await provider.send(renderShippedEmail({ to: "x@y.z", orderNumber: "CUT-2" }, "de"));
    expect(provider.sent).toHaveLength(1);
    expect(provider.sent[0]!.subject).toContain("CUT-2");
  });
});
