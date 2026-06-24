// Minimal typed message catalog for static customer-facing UI copy. Catalog
// content (model/fabric names etc.) is localized in the DB via localize(); this
// covers the chrome (buttons, labels, notices). German is the fallback. Extended
// per workstream across M3; the full i18n milestone (M-i18n) replaces this with a
// richer setup.

import type { Locale } from "./config";

export interface Messages {
  brand: string;
  tagline: string;
  // home
  collections: string;
  allModels: string;
  view: string;
  // pdp
  from: string;
  leadTime: (min: number, max: number) => string;
  allInclusive: string;
  configure: string;
  viewOnlyNotice: string;
  notifyMe: string;
  back: string;
  // configurator
  fabric: string;
  options: string;
  upgrades: string;
  required: string;
  none: string;
  total: string;
  selectRequired: string;
  addToCart: string;
  recalculating: string;
}

const de: Messages = {
  brand: "CUTURA",
  tagline: "Massgeschneiderte Kleidung aus der Schweiz.",
  collections: "Kollektionen",
  allModels: "Alle Modelle",
  view: "Ansehen",
  from: "ab",
  leadTime: (min, max) => `Lieferzeit ${min}-${max} Tage (auf Mass gefertigt)`,
  allInclusive: "inkl. MwSt. und Versand",
  configure: "Konfigurieren",
  viewOnlyNotice: "Dieses Modell ist derzeit nur zur Ansicht und nicht bestellbar.",
  notifyMe: "Benachrichtigen, wenn verfügbar",
  back: "Zurück",
  fabric: "Stoff",
  options: "Optionen",
  upgrades: "Veredelungen",
  required: "erforderlich",
  none: "Keine",
  total: "Gesamt",
  selectRequired: "Bitte alle erforderlichen Optionen wählen.",
  addToCart: "Weiter zu den Massen",
  recalculating: "Preis wird aktualisiert ...",
};

const en: Messages = {
  brand: "CUTURA",
  tagline: "Made-to-measure clothing from Switzerland.",
  collections: "Collections",
  allModels: "All models",
  view: "View",
  from: "from",
  leadTime: (min, max) => `Lead time ${min}-${max} days (made to order)`,
  allInclusive: "incl. VAT and shipping",
  configure: "Configure",
  viewOnlyNotice: "This model is currently view-only and cannot be ordered.",
  notifyMe: "Notify me when available",
  back: "Back",
  fabric: "Fabric",
  options: "Options",
  upgrades: "Upgrades",
  required: "required",
  none: "None",
  total: "Total",
  selectRequired: "Please choose all required options.",
  addToCart: "Continue to measurements",
  recalculating: "Updating price ...",
};

const it: Messages = {
  brand: "CUTURA",
  tagline: "Abbigliamento su misura dalla Svizzera.",
  collections: "Collezioni",
  allModels: "Tutti i modelli",
  view: "Vedi",
  from: "da",
  leadTime: (min, max) => `Tempi di consegna ${min}-${max} giorni (su misura)`,
  allInclusive: "IVA e spedizione incluse",
  configure: "Configura",
  viewOnlyNotice: "Questo modello e attualmente solo visualizzabile e non ordinabile.",
  notifyMe: "Avvisami quando disponibile",
  back: "Indietro",
  fabric: "Tessuto",
  options: "Opzioni",
  upgrades: "Personalizzazioni",
  required: "obbligatorio",
  none: "Nessuna",
  total: "Totale",
  selectRequired: "Scegli tutte le opzioni obbligatorie.",
  addToCart: "Continua con le misure",
  recalculating: "Aggiornamento del prezzo ...",
};

const fr: Messages = {
  brand: "CUTURA",
  tagline: "Vetements sur mesure de Suisse.",
  collections: "Collections",
  allModels: "Tous les modeles",
  view: "Voir",
  from: "des",
  leadTime: (min, max) => `Delai ${min}-${max} jours (fabrique sur mesure)`,
  allInclusive: "TVA et livraison comprises",
  configure: "Configurer",
  viewOnlyNotice: "Ce modele est actuellement en consultation uniquement et non commandable.",
  notifyMe: "Me prevenir quand disponible",
  back: "Retour",
  fabric: "Tissu",
  options: "Options",
  upgrades: "Finitions",
  required: "requis",
  none: "Aucune",
  total: "Total",
  selectRequired: "Veuillez choisir toutes les options requises.",
  addToCart: "Continuer vers les mesures",
  recalculating: "Mise a jour du prix ...",
};

const catalog: Record<Locale, Messages> = { de, en, it, fr };

export function getMessages(locale: Locale): Messages {
  return catalog[locale];
}
