// Minimal typed message catalog for static customer-facing UI copy. Catalog
// content (model/fabric names etc.) is localized in the DB via localize(); this
// covers the chrome (buttons, labels, notices). German is the fallback. Extended
// per workstream across M3; the full i18n milestone (M-i18n) replaces this with a
// richer setup.

import type { Locale } from "./config";

export interface ShirtFieldLabels {
  chest: string;
  waist: string;
  hips: string;
  neck: string;
  shoulder: string;
  sleeveLength: string;
  shirtLength: string;
}

export interface MeasureMessages {
  title: string;
  intro: string;
  wizardCard: string;
  wizardDesc: string;
  detailedCard: string;
  detailedDesc: string;
  height: string;
  weight: string;
  fit: string;
  fitSlim: string;
  fitRegular: string;
  fitRelaxed: string;
  estimate: string;
  reviewTitle: string;
  reviewIntro: string;
  confidenceHigh: string;
  confidenceMedium: string;
  confidenceLow: string;
  confirm: string;
  back: string;
  detailedTitle: string;
  unitCm: string;
  unitInch: string;
  outlierNotice: string;
  saving: string;
  fields: ShirtFieldLabels;
}

export interface Messages {
  brand: string;
  tagline: string;
  collections: string;
  allModels: string;
  view: string;
  from: string;
  leadTime: (min: number, max: number) => string;
  allInclusive: string;
  configure: string;
  viewOnlyNotice: string;
  notifyMe: string;
  back: string;
  fabric: string;
  options: string;
  upgrades: string;
  required: string;
  none: string;
  total: string;
  selectRequired: string;
  addToCart: string;
  recalculating: string;
  measure: MeasureMessages;
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
  measure: {
    title: "Ihre Masse",
    intro: "Wählen Sie, wie Sie Ihre Masse angeben möchten.",
    wizardCard: "Schnell-Assistent",
    wizardDesc: "Wenige Angaben, wir leiten den Rest ab.",
    detailedCard: "Detaillierte Eingabe",
    detailedDesc: "Alle Masse selbst eingeben.",
    height: "Körpergrösse",
    weight: "Gewicht",
    fit: "Passform",
    fitSlim: "Schmal",
    fitRegular: "Normal",
    fitRelaxed: "Locker",
    estimate: "Masse ableiten",
    reviewTitle: "Bitte bestätigen Sie Ihre Masse",
    reviewIntro: "Wir haben diese Masse abgeleitet. Prüfen und anpassen, dann bestätigen.",
    confidenceHigh: "Hohe Genauigkeit",
    confidenceMedium: "Mittlere Genauigkeit",
    confidenceLow: "Geringe Genauigkeit",
    confirm: "Masse bestätigen",
    back: "Zurück",
    detailedTitle: "Masse eingeben (in cm)",
    unitCm: "cm",
    unitInch: "Zoll",
    outlierNotice:
      "Einige Masse sind ungewöhnlich. Ihre Bestellung wird vor der Produktion geprüft.",
    saving: "Wird gespeichert ...",
    fields: {
      chest: "Brustumfang",
      waist: "Taillenumfang",
      hips: "Hüftumfang",
      neck: "Halsumfang",
      shoulder: "Schulterbreite",
      sleeveLength: "Ärmellänge",
      shirtLength: "Hemdlänge",
    },
  },
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
  measure: {
    title: "Your measurements",
    intro: "Choose how you want to provide your measurements.",
    wizardCard: "Quick wizard",
    wizardDesc: "A few inputs; we derive the rest.",
    detailedCard: "Detailed entry",
    detailedDesc: "Enter every measurement yourself.",
    height: "Height",
    weight: "Weight",
    fit: "Fit",
    fitSlim: "Slim",
    fitRegular: "Regular",
    fitRelaxed: "Relaxed",
    estimate: "Derive measurements",
    reviewTitle: "Please confirm your measurements",
    reviewIntro: "We derived these. Review and adjust, then confirm.",
    confidenceHigh: "High confidence",
    confidenceMedium: "Medium confidence",
    confidenceLow: "Low confidence",
    confirm: "Confirm measurements",
    back: "Back",
    detailedTitle: "Enter measurements (in cm)",
    unitCm: "cm",
    unitInch: "inch",
    outlierNotice: "Some measurements are unusual. Your order will be reviewed before production.",
    saving: "Saving ...",
    fields: {
      chest: "Chest",
      waist: "Waist",
      hips: "Hips",
      neck: "Neck",
      shoulder: "Shoulder width",
      sleeveLength: "Sleeve length",
      shirtLength: "Shirt length",
    },
  },
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
  measure: {
    title: "Le tue misure",
    intro: "Scegli come fornire le tue misure.",
    wizardCard: "Procedura rapida",
    wizardDesc: "Pochi dati; deriviamo il resto.",
    detailedCard: "Inserimento dettagliato",
    detailedDesc: "Inserisci tu stesso tutte le misure.",
    height: "Altezza",
    weight: "Peso",
    fit: "Vestibilita",
    fitSlim: "Aderente",
    fitRegular: "Normale",
    fitRelaxed: "Comoda",
    estimate: "Deriva le misure",
    reviewTitle: "Conferma le tue misure",
    reviewIntro: "Abbiamo derivato queste misure. Controlla e modifica, poi conferma.",
    confidenceHigh: "Affidabilita alta",
    confidenceMedium: "Affidabilita media",
    confidenceLow: "Affidabilita bassa",
    confirm: "Conferma le misure",
    back: "Indietro",
    detailedTitle: "Inserisci le misure (in cm)",
    unitCm: "cm",
    unitInch: "pollici",
    outlierNotice:
      "Alcune misure sono insolite. Il tuo ordine sara verificato prima della produzione.",
    saving: "Salvataggio ...",
    fields: {
      chest: "Torace",
      waist: "Vita",
      hips: "Fianchi",
      neck: "Collo",
      shoulder: "Larghezza spalle",
      sleeveLength: "Lunghezza manica",
      shirtLength: "Lunghezza camicia",
    },
  },
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
  measure: {
    title: "Vos mesures",
    intro: "Choisissez comment fournir vos mesures.",
    wizardCard: "Assistant rapide",
    wizardDesc: "Quelques donnees; nous deduisons le reste.",
    detailedCard: "Saisie detaillee",
    detailedDesc: "Saisissez vous-meme toutes les mesures.",
    height: "Taille",
    weight: "Poids",
    fit: "Coupe",
    fitSlim: "Ajustee",
    fitRegular: "Normale",
    fitRelaxed: "Ample",
    estimate: "Deduire les mesures",
    reviewTitle: "Veuillez confirmer vos mesures",
    reviewIntro: "Nous avons deduit ces mesures. Verifiez et ajustez, puis confirmez.",
    confidenceHigh: "Confiance elevee",
    confidenceMedium: "Confiance moyenne",
    confidenceLow: "Confiance faible",
    confirm: "Confirmer les mesures",
    back: "Retour",
    detailedTitle: "Saisir les mesures (en cm)",
    unitCm: "cm",
    unitInch: "pouce",
    outlierNotice:
      "Certaines mesures sont inhabituelles. Votre commande sera verifiee avant production.",
    saving: "Enregistrement ...",
    fields: {
      chest: "Poitrine",
      waist: "Taille",
      hips: "Hanches",
      neck: "Cou",
      shoulder: "Largeur d epaules",
      sleeveLength: "Longueur de manche",
      shirtLength: "Longueur de chemise",
    },
  },
};

const catalog: Record<Locale, Messages> = { de, en, it, fr };

export function getMessages(locale: Locale): Messages {
  return catalog[locale];
}
