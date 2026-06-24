import type { EmailLocale } from "./email";

// Localized parcel-card content (FR-930, FR-8E0). The sewn-in label stays
// language-neutral (composition + international care symbols); this card carries
// the localized care guidance + note that goes in the parcel. Pure.
export interface ParcelCardContent {
  greeting: string;
  careHeading: string;
  careBody: string;
  symbolsNote: string;
  thanks: string;
}

const CARD: Record<EmailLocale, ParcelCardContent> = {
  de: {
    greeting: "Ihr massgefertigtes Stueck von CUTURA",
    careHeading: "Pflege",
    careBody:
      "Bei niedriger Temperatur waschen, in Form trocknen und bei Bedarf mit massiger Hitze buegeln.",
    symbolsNote: "Die internationalen Pflegesymbole finden Sie auf dem eingenaehten Etikett.",
    thanks: "Danke, dass Sie CUTURA gewaehlt haben.",
  },
  en: {
    greeting: "Your made-to-measure piece from CUTURA",
    careHeading: "Care",
    careBody: "Wash at a low temperature, dry in shape, and iron at a moderate heat if needed.",
    symbolsNote: "The international care symbols are on the sewn-in label.",
    thanks: "Thank you for choosing CUTURA.",
  },
  it: {
    greeting: "Il tuo capo su misura di CUTURA",
    careHeading: "Cura",
    careBody:
      "Lavare a bassa temperatura, asciugare in forma e stirare a calore moderato se necessario.",
    symbolsNote: "I simboli di lavaggio internazionali sono sull'etichetta cucita.",
    thanks: "Grazie per aver scelto CUTURA.",
  },
  fr: {
    greeting: "Votre piece sur mesure de CUTURA",
    careHeading: "Entretien",
    careBody:
      "Laver a basse temperature, secher a plat et repasser a chaleur moderee si necessaire.",
    symbolsNote: "Les symboles d'entretien internationaux figurent sur l'etiquette cousue.",
    thanks: "Merci d'avoir choisi CUTURA.",
  },
};

export function parcelCardContent(locale: EmailLocale): ParcelCardContent {
  return CARD[locale] ?? CARD.de;
}
