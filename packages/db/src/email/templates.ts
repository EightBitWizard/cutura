import {
  type EmailAttachment,
  type EmailLocale,
  type EmailMessage,
  type SupplierSpec,
  formatCHF,
} from "@cutura/core";

const FROM = "CUTURA <orders@cutura.ch>";

const confirmation: Record<
  EmailLocale,
  { subject: string; heading: string; body: string; total: string }
> = {
  de: {
    subject: "Ihre CUTURA Bestellung",
    heading: "Vielen Dank für Ihre Bestellung",
    body: "Wir haben Ihre Bestellung erhalten und beginnen mit der Fertigung auf Mass.",
    total: "Gesamt",
  },
  en: {
    subject: "Your CUTURA order",
    heading: "Thank you for your order",
    body: "We have received your order and are starting your made-to-measure production.",
    total: "Total",
  },
  it: {
    subject: "Il tuo ordine CUTURA",
    heading: "Grazie per il tuo ordine",
    body: "Abbiamo ricevuto il tuo ordine e iniziamo la produzione su misura.",
    total: "Totale",
  },
  fr: {
    subject: "Votre commande CUTURA",
    heading: "Merci pour votre commande",
    body: "Nous avons recu votre commande et commencons votre fabrication sur mesure.",
    total: "Total",
  },
};

const shipped: Record<EmailLocale, { subject: string; heading: string; body: string }> = {
  de: {
    subject: "Ihre CUTURA Bestellung ist unterwegs",
    heading: "Ihre Bestellung wurde versandt",
    body: "Ihre auf Mass gefertigte Bestellung ist auf dem Weg zu Ihnen.",
  },
  en: {
    subject: "Your CUTURA order has shipped",
    heading: "Your order is on its way",
    body: "Your made-to-measure order is on its way to you.",
  },
  it: {
    subject: "Il tuo ordine CUTURA e in arrivo",
    heading: "Il tuo ordine e stato spedito",
    body: "Il tuo ordine su misura e in viaggio verso di te.",
  },
  fr: {
    subject: "Votre commande CUTURA est expediee",
    heading: "Votre commande est en route",
    body: "Votre commande sur mesure est en route.",
  },
};

function pick<T>(map: Record<EmailLocale, T>, locale: EmailLocale): T {
  return map[locale] ?? map.de;
}

export function renderOrderConfirmation(
  input: { to: string; orderNumber: string; totalMinor: number },
  locale: EmailLocale,
): EmailMessage {
  const t = pick(confirmation, locale);
  const total = formatCHF(input.totalMinor);
  return {
    to: input.to,
    from: FROM,
    subject: `${t.subject} ${input.orderNumber}`,
    html: `<h1>${t.heading}</h1><p>${t.body}</p><p>${input.orderNumber}</p><p>${t.total}: ${total}</p>`,
    text: `${t.heading}\n${t.body}\n${input.orderNumber}\n${t.total}: ${total}`,
  };
}

export function renderShippedEmail(
  input: { to: string; orderNumber: string },
  locale: EmailLocale,
): EmailMessage {
  const t = pick(shipped, locale);
  return {
    to: input.to,
    from: FROM,
    subject: `${t.subject} (${input.orderNumber})`,
    html: `<h1>${t.heading}</h1><p>${t.body}</p><p>${input.orderNumber}</p>`,
    text: `${t.heading}\n${t.body}\n${input.orderNumber}`,
  };
}

const magicLink: Record<
  EmailLocale,
  { subject: string; heading: string; body: string; cta: string; expiry: string }
> = {
  de: {
    subject: "Ihr CUTURA Anmeldelink",
    heading: "Bei CUTURA anmelden",
    body: "Klicken Sie auf den Link, um sich anzumelden oder ein Konto zu erstellen.",
    cta: "Anmelden",
    expiry: "Der Link ist 15 Minuten gültig und nur einmal verwendbar.",
  },
  en: {
    subject: "Your CUTURA sign-in link",
    heading: "Sign in to CUTURA",
    body: "Click the link to sign in or create your account.",
    cta: "Sign in",
    expiry: "The link is valid for 15 minutes and can be used once.",
  },
  it: {
    subject: "Il tuo link di accesso CUTURA",
    heading: "Accedi a CUTURA",
    body: "Clicca sul link per accedere o creare il tuo account.",
    cta: "Accedi",
    expiry: "Il link e valido 15 minuti e utilizzabile una sola volta.",
  },
  fr: {
    subject: "Votre lien de connexion CUTURA",
    heading: "Se connecter a CUTURA",
    body: "Cliquez sur le lien pour vous connecter ou creer votre compte.",
    cta: "Se connecter",
    expiry: "Le lien est valable 15 minutes et utilisable une seule fois.",
  },
};

/** Passwordless sign-in / account-recovery link (FR-610/620). */
export function renderMagicLinkEmail(
  input: { to: string; magicUrl: string },
  locale: EmailLocale,
): EmailMessage {
  const t = pick(magicLink, locale);
  return {
    to: input.to,
    from: FROM,
    subject: t.subject,
    html: `<h1>${t.heading}</h1><p>${t.body}</p><p><a href="${input.magicUrl}">${t.cta}</a></p><p>${t.expiry}</p>`,
    text: `${t.heading}\n${t.body}\n${input.magicUrl}\n${t.expiry}`,
  };
}

/** Supplier production email (German; the tailor-facing language). Carries the PDF spec. */
export function renderSupplierEmail(input: {
  to: string;
  orderNumber: string;
  spec: SupplierSpec;
  pdf: EmailAttachment;
}): EmailMessage {
  const lines = input.spec.measurements.map((m) => `${m.label}: ${m.value} cm`).join("<br/>");
  return {
    to: input.to,
    from: FROM,
    subject: `CUTURA Produktionsauftrag ${input.orderNumber}`,
    html: `<h1>Produktionsauftrag ${input.orderNumber}</h1><p>Modell: ${input.spec.baseModelName} - Stoff: ${input.spec.fabricCode}</p><p>${lines}</p><p>Die vollständige Spezifikation finden Sie im angehängten PDF.</p>`,
    text: `Produktionsauftrag ${input.orderNumber}\nModell: ${input.spec.baseModelName}\nStoff: ${input.spec.fabricCode}`,
    attachments: [input.pdf],
  };
}
