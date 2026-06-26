// Minimal typed message catalog for static customer-facing UI copy. Catalog
// content (model/fabric names etc.) is localized in the DB via localize(); this
// covers the chrome (buttons, labels, notices). German is the fallback. Extended
// per workstream across M3; the full i18n milestone (M-i18n) replaces this with a
// richer setup.

import type { CustomerMilestone } from "@cutura/core";

import type { Locale } from "./config";

export interface MeasurementFieldLabels {
  // Shirt
  chest: string;
  waist: string;
  hips: string;
  neck: string;
  shoulder: string;
  sleeveLength: string;
  shirtLength: string;
  // Trouser
  inseam: string;
  outseam: string;
  thigh: string;
  knee: string;
  legOpening: string;
  rise: string;
}

/** @deprecated use MeasurementFieldLabels (now covers all garment types). */
export type ShirtFieldLabels = MeasurementFieldLabels;

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

export interface CartMessages {
  title: string;
  empty: string;
  remove: string;
  measurementProvided: string;
  measurementMissing: string;
  addMeasurement: string;
  total: string;
  checkout: string;
  base: string;
}

export interface CheckoutMessages {
  title: string;
  email: string;
  line1: string;
  city: string;
  zip: string;
  country: string;
  phoneOptional: string;
  acceptTerms: string;
  acceptPrivacy: string;
  placeOrder: string;
  missingConfig: string;
  missingMeasurement: string;
  mustAccept: string;
  regionNote: string;
  redirecting: string;
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
  notifyThanks: string;
  materials: string;
  youMightAlsoLike: string;
  recommendedForYou: string;
  fitGuide: string;
  garmentNames: { shirt: string; trouser: string };
  consentText: string;
  consentAccept: string;
  consentDecline: string;
  contact: string;
  contactName: string;
  contactMessageLabel: string;
  contactSend: string;
  contactSent: string;
  help: string;
  maintenanceTitle: string;
  maintenanceBody: string;
  discoverTitle: string;
  filters: string;
  sortLabel: string;
  sortPriceAsc: string;
  sortPriceDesc: string;
  sortName: string;
  orderableOnly: string;
  apply: string;
  noResults: string;
  searchTitle: string;
  searchPlaceholder: string;
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
  cart: CartMessages;
  checkout: CheckoutMessages;
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
  notifyThanks: "Danke, wir benachrichtigen Sie, sobald es verfügbar ist.",
  materials: "Materialien",
  youMightAlsoLike: "Das könnte Ihnen auch gefallen",
  recommendedForYou: "Für Sie empfohlen",
  fitGuide: "Passform- und Massleitfaden",
  garmentNames: { shirt: "Hemd", trouser: "Hose" },
  consentText:
    "Wir verwenden notwendige Cookies. Optionale Analyse-Cookies nur mit Ihrer Zustimmung.",
  consentAccept: "Alle akzeptieren",
  consentDecline: "Nur notwendige",
  contact: "Kontakt",
  contactName: "Name",
  contactMessageLabel: "Nachricht",
  contactSend: "Senden",
  contactSent: "Danke, wir haben Ihre Nachricht erhalten.",
  help: "Hilfe und haeufige Fragen",
  maintenanceTitle: "Wartung",
  maintenanceBody: "Wir sind in Kuerze wieder da. Vielen Dank fuer Ihre Geduld.",
  discoverTitle: "Entdecken",
  filters: "Filter",
  sortLabel: "Sortieren",
  sortPriceAsc: "Preis aufsteigend",
  sortPriceDesc: "Preis absteigend",
  sortName: "Name",
  orderableOnly: "Nur bestellbar",
  apply: "Anwenden",
  noResults: "Keine Ergebnisse.",
  searchTitle: "Suche",
  searchPlaceholder: "Modelle und Inhalte suchen",
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
      inseam: "Schrittlänge",
      outseam: "Aussenlänge",
      thigh: "Oberschenkelumfang",
      knee: "Knieumfang",
      legOpening: "Beinöffnung",
      rise: "Schritttiefe",
    },
  },
  cart: {
    title: "Warenkorb",
    empty: "Ihr Warenkorb ist leer.",
    remove: "Entfernen",
    measurementProvided: "Masse erfasst.",
    measurementMissing: "Noch keine Masse erfasst.",
    addMeasurement: "Masse erfassen",
    total: "Gesamt",
    checkout: "Zur Kasse",
    base: "Grundpreis",
  },
  checkout: {
    title: "Kasse",
    email: "E-Mail",
    line1: "Adresse",
    city: "Ort",
    zip: "PLZ",
    country: "Land",
    phoneOptional: "Telefon (optional)",
    acceptTerms: "Ich akzeptiere die AGB",
    acceptPrivacy: "Ich akzeptiere die Datenschutzerklärung",
    placeOrder: "Zahlungspflichtig bestellen",
    missingConfig: "Eine Position ist unvollständig konfiguriert.",
    missingMeasurement: "Bitte zuerst Ihre Masse erfassen.",
    mustAccept: "Bitte AGB und Datenschutz akzeptieren.",
    regionNote: "Lieferung nur in die Schweiz und nach Liechtenstein.",
    redirecting: "Weiterleitung zur Zahlung ...",
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
  notifyThanks: "Thank you, we will let you know when it is available.",
  materials: "Materials",
  youMightAlsoLike: "You might also like",
  recommendedForYou: "Recommended for you",
  fitGuide: "Fit and size guide",
  garmentNames: { shirt: "Shirt", trouser: "Trousers" },
  consentText: "We use necessary cookies. Optional analytics cookies only with your consent.",
  consentAccept: "Accept all",
  consentDecline: "Necessary only",
  contact: "Contact",
  contactName: "Name",
  contactMessageLabel: "Message",
  contactSend: "Send",
  contactSent: "Thank you, we have received your message.",
  help: "Help and FAQ",
  maintenanceTitle: "Maintenance",
  maintenanceBody: "We will be back shortly. Thank you for your patience.",
  discoverTitle: "Discover",
  filters: "Filters",
  sortLabel: "Sort",
  sortPriceAsc: "Price low to high",
  sortPriceDesc: "Price high to low",
  sortName: "Name",
  orderableOnly: "Orderable only",
  apply: "Apply",
  noResults: "No results.",
  searchTitle: "Search",
  searchPlaceholder: "Search models and content",
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
      inseam: "Inseam",
      outseam: "Outseam",
      thigh: "Thigh",
      knee: "Knee",
      legOpening: "Leg opening",
      rise: "Rise",
    },
  },
  cart: {
    title: "Cart",
    empty: "Your cart is empty.",
    remove: "Remove",
    measurementProvided: "Measurements captured.",
    measurementMissing: "No measurements yet.",
    addMeasurement: "Add measurements",
    total: "Total",
    checkout: "Checkout",
    base: "Base price",
  },
  checkout: {
    title: "Checkout",
    email: "Email",
    line1: "Address",
    city: "City",
    zip: "Postal code",
    country: "Country",
    phoneOptional: "Phone (optional)",
    acceptTerms: "I accept the Terms",
    acceptPrivacy: "I accept the Privacy Policy",
    placeOrder: "Place order",
    missingConfig: "An item is incompletely configured.",
    missingMeasurement: "Please capture your measurements first.",
    mustAccept: "Please accept the Terms and Privacy Policy.",
    regionNote: "Delivery to Switzerland and Liechtenstein only.",
    redirecting: "Redirecting to payment ...",
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
  notifyThanks: "Grazie, ti avviseremo quando sara disponibile.",
  materials: "Materiali",
  youMightAlsoLike: "Potrebbe interessarti anche",
  recommendedForYou: "Consigliati per te",
  fitGuide: "Guida a vestibilita e misure",
  garmentNames: { shirt: "Camicia", trouser: "Pantaloni" },
  consentText: "Usiamo cookie necessari. Cookie di analisi opzionali solo con il tuo consenso.",
  consentAccept: "Accetta tutti",
  consentDecline: "Solo necessari",
  contact: "Contatti",
  contactName: "Nome",
  contactMessageLabel: "Messaggio",
  contactSend: "Invia",
  contactSent: "Grazie, abbiamo ricevuto il tuo messaggio.",
  help: "Aiuto e domande frequenti",
  maintenanceTitle: "Manutenzione",
  maintenanceBody: "Torniamo a breve. Grazie per la pazienza.",
  discoverTitle: "Scopri",
  filters: "Filtri",
  sortLabel: "Ordina",
  sortPriceAsc: "Prezzo crescente",
  sortPriceDesc: "Prezzo decrescente",
  sortName: "Nome",
  orderableOnly: "Solo ordinabili",
  apply: "Applica",
  noResults: "Nessun risultato.",
  searchTitle: "Cerca",
  searchPlaceholder: "Cerca modelli e contenuti",
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
      inseam: "Cavallo interno",
      outseam: "Lunghezza esterna",
      thigh: "Coscia",
      knee: "Ginocchio",
      legOpening: "Apertura gamba",
      rise: "Altezza cavallo",
    },
  },
  cart: {
    title: "Carrello",
    empty: "Il tuo carrello e vuoto.",
    remove: "Rimuovi",
    measurementProvided: "Misure acquisite.",
    measurementMissing: "Nessuna misura ancora.",
    addMeasurement: "Aggiungi le misure",
    total: "Totale",
    checkout: "Cassa",
    base: "Prezzo base",
  },
  checkout: {
    title: "Cassa",
    email: "Email",
    line1: "Indirizzo",
    city: "Citta",
    zip: "CAP",
    country: "Paese",
    phoneOptional: "Telefono (facoltativo)",
    acceptTerms: "Accetto le condizioni",
    acceptPrivacy: "Accetto l informativa sulla privacy",
    placeOrder: "Ordina",
    missingConfig: "Un articolo non e configurato completamente.",
    missingMeasurement: "Acquisisci prima le tue misure.",
    mustAccept: "Accetta le condizioni e la privacy.",
    regionNote: "Spedizione solo in Svizzera e Liechtenstein.",
    redirecting: "Reindirizzamento al pagamento ...",
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
  notifyThanks: "Merci, nous vous previendrons des que disponible.",
  materials: "Matieres",
  youMightAlsoLike: "Vous pourriez aussi aimer",
  recommendedForYou: "Recommandé pour vous",
  fitGuide: "Guide des tailles et coupes",
  garmentNames: { shirt: "Chemise", trouser: "Pantalon" },
  consentText:
    "Nous utilisons des cookies necessaires. Cookies d'analyse optionnels seulement avec votre accord.",
  consentAccept: "Tout accepter",
  consentDecline: "Necessaires seulement",
  contact: "Contact",
  contactName: "Nom",
  contactMessageLabel: "Message",
  contactSend: "Envoyer",
  contactSent: "Merci, nous avons bien recu votre message.",
  help: "Aide et FAQ",
  maintenanceTitle: "Maintenance",
  maintenanceBody: "Nous revenons bientot. Merci de votre patience.",
  discoverTitle: "Decouvrir",
  filters: "Filtres",
  sortLabel: "Trier",
  sortPriceAsc: "Prix croissant",
  sortPriceDesc: "Prix decroissant",
  sortName: "Nom",
  orderableOnly: "Commandables uniquement",
  apply: "Appliquer",
  noResults: "Aucun resultat.",
  searchTitle: "Recherche",
  searchPlaceholder: "Rechercher des modeles et du contenu",
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
      inseam: "Entrejambe",
      outseam: "Longueur exterieure",
      thigh: "Cuisse",
      knee: "Genou",
      legOpening: "Bas de jambe",
      rise: "Hauteur d entrejambe",
    },
  },
  cart: {
    title: "Panier",
    empty: "Votre panier est vide.",
    remove: "Retirer",
    measurementProvided: "Mesures enregistrees.",
    measurementMissing: "Pas encore de mesures.",
    addMeasurement: "Ajouter les mesures",
    total: "Total",
    checkout: "Commander",
    base: "Prix de base",
  },
  checkout: {
    title: "Commande",
    email: "E-mail",
    line1: "Adresse",
    city: "Ville",
    zip: "Code postal",
    country: "Pays",
    phoneOptional: "Telephone (facultatif)",
    acceptTerms: "J accepte les conditions",
    acceptPrivacy: "J accepte la politique de confidentialite",
    placeOrder: "Commander",
    missingConfig: "Un article est configure de maniere incomplete.",
    missingMeasurement: "Veuillez d abord enregistrer vos mesures.",
    mustAccept: "Veuillez accepter les conditions et la confidentialite.",
    regionNote: "Livraison en Suisse et au Liechtenstein uniquement.",
    redirecting: "Redirection vers le paiement ...",
  },
};

const catalog: Record<Locale, Messages> = { de, en, it, fr };

export function getMessages(locale: Locale): Messages {
  return catalog[locale];
}

export interface AccountMessages {
  loginTitle: string;
  loginIntro: string;
  emailLabel: string;
  sendLink: string;
  linkSent: string;
  signOut: string;
  title: string;
  navProfile: string;
  navOrders: string;
  navAddresses: string;
  navPrivacy: string;
  errExpired: string;
  errDisabled: string;
  errThrottled: string;
  addAddress: string;
  makeDefault: string;
  defaultLabel: string;
  exportData: string;
  deleteData: string;
  deleteWarning: string;
}

const accountCatalog: Record<Locale, AccountMessages> = {
  de: {
    loginTitle: "Anmelden",
    loginIntro: "Geben Sie Ihre E-Mail ein. Wir senden Ihnen einen Anmeldelink.",
    emailLabel: "E-Mail",
    sendLink: "Link senden",
    linkSent: "Wenn ein Konto existiert, ist ein Link unterwegs. Prüfen Sie Ihr Postfach.",
    signOut: "Abmelden",
    title: "Mein Konto",
    navProfile: "Masse",
    navOrders: "Bestellungen",
    navAddresses: "Adressen",
    navPrivacy: "Daten und Datenschutz",
    errExpired: "Der Link ist abgelaufen oder ungültig. Bitte fordern Sie einen neuen an.",
    errDisabled: "Dieses Konto ist nicht verfügbar.",
    errThrottled: "Zu viele Versuche. Bitte später erneut versuchen.",
    addAddress: "Adresse hinzufügen",
    makeDefault: "Als Standard",
    defaultLabel: "Standard",
    exportData: "Meine Daten exportieren",
    deleteData: "Mein Konto und meine Daten löschen",
    deleteWarning:
      "Dies löscht Ihre persönlichen Daten unwiderruflich. Bestellungen bleiben aus buchhalterischen Gründen anonymisiert erhalten.",
  },
  en: {
    loginTitle: "Sign in",
    loginIntro: "Enter your email and we will send you a sign-in link.",
    emailLabel: "Email",
    sendLink: "Send link",
    linkSent: "If an account exists, a link is on its way. Check your inbox.",
    signOut: "Sign out",
    title: "My account",
    navProfile: "Measurements",
    navOrders: "Orders",
    navAddresses: "Addresses",
    navPrivacy: "Data and privacy",
    errExpired: "The link expired or is invalid. Please request a new one.",
    errDisabled: "This account is not available.",
    errThrottled: "Too many attempts. Please try again later.",
    addAddress: "Add address",
    makeDefault: "Set as default",
    defaultLabel: "Default",
    exportData: "Export my data",
    deleteData: "Delete my account and data",
    deleteWarning:
      "This permanently deletes your personal data. Orders are kept, anonymized, for accounting.",
  },
  it: {
    loginTitle: "Accedi",
    loginIntro: "Inserisci la tua email e ti invieremo un link di accesso.",
    emailLabel: "Email",
    sendLink: "Invia link",
    linkSent: "Se esiste un account, il link e in arrivo. Controlla la posta.",
    signOut: "Esci",
    title: "Il mio account",
    navProfile: "Misure",
    navOrders: "Ordini",
    navAddresses: "Indirizzi",
    navPrivacy: "Dati e privacy",
    errExpired: "Il link e scaduto o non valido. Richiedine uno nuovo.",
    errDisabled: "Questo account non e disponibile.",
    errThrottled: "Troppi tentativi. Riprova piu tardi.",
    addAddress: "Aggiungi indirizzo",
    makeDefault: "Imposta come predefinito",
    defaultLabel: "Predefinito",
    exportData: "Esporta i miei dati",
    deleteData: "Elimina il mio account e i dati",
    deleteWarning:
      "Questo elimina definitivamente i tuoi dati personali. Gli ordini restano, anonimizzati, per la contabilita.",
  },
  fr: {
    loginTitle: "Se connecter",
    loginIntro: "Saisissez votre e-mail et nous vous enverrons un lien de connexion.",
    emailLabel: "E-mail",
    sendLink: "Envoyer le lien",
    linkSent: "Si un compte existe, un lien arrive. Verifiez votre boite.",
    signOut: "Se deconnecter",
    title: "Mon compte",
    navProfile: "Mesures",
    navOrders: "Commandes",
    navAddresses: "Adresses",
    navPrivacy: "Donnees et confidentialite",
    errExpired: "Le lien a expire ou est invalide. Veuillez en demander un nouveau.",
    errDisabled: "Ce compte n est pas disponible.",
    errThrottled: "Trop de tentatives. Reessayez plus tard.",
    addAddress: "Ajouter une adresse",
    makeDefault: "Definir par defaut",
    defaultLabel: "Par defaut",
    exportData: "Exporter mes donnees",
    deleteData: "Supprimer mon compte et mes donnees",
    deleteWarning:
      "Ceci supprime definitivement vos donnees personnelles. Les commandes sont conservees, anonymisees, pour la comptabilite.",
  },
};

export function getAccountMessages(locale: Locale): AccountMessages {
  return accountCatalog[locale];
}

export const milestoneLabels: Record<Locale, Record<CustomerMilestone, string>> = {
  de: {
    received: "Eingegangen",
    in_production: "In Produktion",
    quality_check: "Qualitätskontrolle",
    shipped: "Versandt",
    attention: "In Bearbeitung",
  },
  en: {
    received: "Received",
    in_production: "In production",
    quality_check: "Quality check",
    shipped: "Shipped",
    attention: "In progress",
  },
  it: {
    received: "Ricevuto",
    in_production: "In produzione",
    quality_check: "Controllo qualita",
    shipped: "Spedito",
    attention: "In corso",
  },
  fr: {
    received: "Recu",
    in_production: "En production",
    quality_check: "Controle qualite",
    shipped: "Expedie",
    attention: "En cours",
  },
};

export interface OrderMessages {
  ordersTitle: string;
  viewOrder: string;
  trackingTitle: string;
  empty: string;
  orderNumber: string;
  fitReview: string;
  feedback: string;
  reorderTitle: string;
  reorderKeep: string;
  reorderUpdate: string;
  reasonLabel: string;
  photosLabel: string;
  submit: string;
  ratingLabel: string;
  submitted: string;
}

const orderCatalog: Record<Locale, OrderMessages> = {
  de: {
    ordersTitle: "Bestellungen",
    viewOrder: "Ansehen",
    trackingTitle: "Bestellverfolgung",
    empty: "Noch keine Bestellungen.",
    orderNumber: "Bestellnummer",
    fitReview: "Passform reklamieren",
    feedback: "Feedback geben",
    reorderTitle: "Erneut bestellen",
    reorderKeep: "Masse wie bestellt",
    reorderUpdate: "Aktuelle Masse verwenden",
    reasonLabel: "Grund",
    photosLabel: "Fotos (optional)",
    submit: "Senden",
    ratingLabel: "Gesamtbewertung (1-5)",
    submitted: "Vielen Dank, wir haben Ihre Angaben erhalten.",
  },
  en: {
    ordersTitle: "Orders",
    viewOrder: "View",
    trackingTitle: "Order tracking",
    empty: "No orders yet.",
    orderNumber: "Order number",
    fitReview: "Report a fit issue",
    feedback: "Give feedback",
    reorderTitle: "Reorder",
    reorderKeep: "Keep size as ordered",
    reorderUpdate: "Use my latest measurements",
    reasonLabel: "Reason",
    photosLabel: "Photos (optional)",
    submit: "Submit",
    ratingLabel: "Overall rating (1-5)",
    submitted: "Thank you, we have received your input.",
  },
  it: {
    ordersTitle: "Ordini",
    viewOrder: "Vedi",
    trackingTitle: "Tracciamento ordine",
    empty: "Nessun ordine.",
    orderNumber: "Numero ordine",
    fitReview: "Segnala un problema di vestibilita",
    feedback: "Lascia un feedback",
    reorderTitle: "Riordina",
    reorderKeep: "Misure come ordinate",
    reorderUpdate: "Usa le mie ultime misure",
    reasonLabel: "Motivo",
    photosLabel: "Foto (facoltativo)",
    submit: "Invia",
    ratingLabel: "Valutazione complessiva (1-5)",
    submitted: "Grazie, abbiamo ricevuto i tuoi dati.",
  },
  fr: {
    ordersTitle: "Commandes",
    viewOrder: "Voir",
    trackingTitle: "Suivi de commande",
    empty: "Aucune commande.",
    orderNumber: "Numero de commande",
    fitReview: "Signaler un probleme de coupe",
    feedback: "Donner un avis",
    reorderTitle: "Recommander",
    reorderKeep: "Mesures comme commandees",
    reorderUpdate: "Utiliser mes dernieres mesures",
    reasonLabel: "Motif",
    photosLabel: "Photos (facultatif)",
    submit: "Envoyer",
    ratingLabel: "Note globale (1-5)",
    submitted: "Merci, nous avons bien recu vos informations.",
  },
};

export function getOrderMessages(locale: Locale): OrderMessages {
  return orderCatalog[locale];
}

export interface FooterMessages {
  helpHeading: string;
  legalHeading: string;
  about: string;
  faq: string;
  contact: string;
  imprint: string;
  terms: string;
  privacy: string;
  shipping: string;
  fitGuarantee: string;
}

const footerCatalog: Record<Locale, FooterMessages> = {
  de: {
    helpHeading: "Hilfe",
    legalHeading: "Rechtliches",
    about: "Über uns",
    faq: "Häufige Fragen",
    contact: "Kontakt",
    imprint: "Impressum",
    terms: "AGB",
    privacy: "Datenschutz",
    shipping: "Versand",
    fitGuarantee: "Passformgarantie",
  },
  en: {
    helpHeading: "Help",
    legalHeading: "Legal",
    about: "About",
    faq: "FAQ",
    contact: "Contact",
    imprint: "Imprint",
    terms: "Terms",
    privacy: "Privacy",
    shipping: "Shipping",
    fitGuarantee: "Fit guarantee",
  },
  it: {
    helpHeading: "Assistenza",
    legalHeading: "Note legali",
    about: "Chi siamo",
    faq: "Domande frequenti",
    contact: "Contatti",
    imprint: "Note legali",
    terms: "Condizioni",
    privacy: "Privacy",
    shipping: "Spedizione",
    fitGuarantee: "Garanzia di vestibilità",
  },
  fr: {
    helpHeading: "Aide",
    legalHeading: "Informations légales",
    about: "À propos",
    faq: "FAQ",
    contact: "Contact",
    imprint: "Mentions légales",
    terms: "Conditions générales",
    privacy: "Confidentialité",
    shipping: "Livraison",
    fitGuarantee: "Garantie d'ajustement",
  },
};

export function getFooterMessages(locale: Locale): FooterMessages {
  return footerCatalog[locale];
}

export interface HomeMessages {
  heroEyebrow: string;
  heroLead: string;
  heroCta: string;
  processHeading: string;
  steps: { title: string; body: string }[];
  fabricEyebrow: string;
  fabricTitle: string;
  fabricBody: string;
  trustEyebrow: string;
  trustTitle: string;
  trustBody: string;
  previewHeading: string;
  viewAll: string;
  viewCollection: string;
}

const homeCatalog: Record<Locale, HomeMessages> = {
  de: {
    heroEyebrow: "Massgeschneidert",
    heroLead:
      "Konfigurieren Sie Ihr Kleidungsstück, geben Sie Ihre Masse an, und wir fertigen es für Sie. Alle Preise inklusive MwSt. und Versand.",
    heroCta: "Modelle entdecken",
    processHeading: "So funktioniert es",
    steps: [
      {
        title: "Konfigurieren",
        body: "Wählen Sie Modell, Stoff und Details. Den Preis sehen Sie sofort, inklusive aller Kosten.",
      },
      {
        title: "Masse angeben",
        body: "Wir führen Sie Schritt für Schritt. Kein Schneider nötig.",
      },
      {
        title: "Gefertigt und geliefert",
        body: "Auf Mass gefertigt und zu Ihnen geliefert. Mit Passformgarantie.",
      },
    ],
    fabricEyebrow: "Material",
    fabricTitle: "Stoffe mit Charakter",
    fabricBody:
      "Wir wählen Stoffe nach Griff, Gewicht und Haltbarkeit. Jedes Detail, von der Naht bis zum Knopf, ist auf Tragekomfort und Langlebigkeit ausgelegt.",
    trustEyebrow: "Qualität",
    trustTitle: "Auf Mass gefertigt, in der Schweiz geprüft",
    trustBody:
      "Jedes Stück wird nach Ihren Massen gefertigt und vor dem Versand in der Schweiz geprüft. Passt etwas nicht, fertigen wir es neu - das ist unsere Passformgarantie.",
    previewHeading: "Unsere Modelle",
    viewAll: "Alle Modelle ansehen",
    viewCollection: "Kollektion ansehen",
  },
  en: {
    heroEyebrow: "Made to measure",
    heroLead:
      "Configure your garment, share your measurements, and we tailor it for you. All prices include VAT and shipping.",
    heroCta: "Discover models",
    processHeading: "How it works",
    steps: [
      {
        title: "Configure",
        body: "Choose your model, fabric, and details. See the all-inclusive price as you go.",
      },
      {
        title: "Share measurements",
        body: "We guide you step by step. No tailor needed.",
      },
      {
        title: "Tailored and delivered",
        body: "Handcrafted to your size and delivered to you. With a fit guarantee.",
      },
    ],
    fabricEyebrow: "Material",
    fabricTitle: "Cloth with character",
    fabricBody:
      "We choose fabrics for their hand, weight, and durability. Every detail, from the seam to the button, is made for comfort and longevity.",
    trustEyebrow: "Quality",
    trustTitle: "Made to your measure, checked in Switzerland",
    trustBody:
      "Every piece is made to your measurements and quality-checked in Switzerland before it ships. If something is not right, we remake it - that is our fit guarantee.",
    previewHeading: "Our models",
    viewAll: "View all models",
    viewCollection: "View collection",
  },
  it: {
    heroEyebrow: "Su misura",
    heroLead:
      "Configura il tuo capo, indica le tue misure e lo realizziamo per te. Tutti i prezzi includono IVA e spedizione.",
    heroCta: "Scopri i modelli",
    processHeading: "Come funziona",
    steps: [
      {
        title: "Configura",
        body: "Scegli modello, tessuto e dettagli. Vedi subito il prezzo, tutto incluso.",
      },
      {
        title: "Indica le misure",
        body: "Ti guidiamo passo dopo passo. Nessun sarto necessario.",
      },
      {
        title: "Realizzato e consegnato",
        body: "Confezionato su misura e consegnato a te. Con garanzia di vestibilità.",
      },
    ],
    fabricEyebrow: "Materiale",
    fabricTitle: "Tessuti con carattere",
    fabricBody:
      "Scegliamo i tessuti per mano, peso e durata. Ogni dettaglio, dalla cucitura al bottone, è pensato per comfort e durata.",
    trustEyebrow: "Qualità",
    trustTitle: "Su misura, controllato in Svizzera",
    trustBody:
      "Ogni capo è realizzato sulle tue misure e controllato in Svizzera prima della spedizione. Se qualcosa non va, lo rifacciamo: è la nostra garanzia di vestibilità.",
    previewHeading: "I nostri modelli",
    viewAll: "Vedi tutti i modelli",
    viewCollection: "Vedi la collezione",
  },
  fr: {
    heroEyebrow: "Sur mesure",
    heroLead:
      "Configurez votre vêtement, indiquez vos mesures, et nous le confectionnons pour vous. Tous les prix comprennent la TVA et la livraison.",
    heroCta: "Découvrir les modèles",
    processHeading: "Comment ça marche",
    steps: [
      {
        title: "Configurer",
        body: "Choisissez le modèle, le tissu et les détails. Le prix tout compris s'affiche au fur et à mesure.",
      },
      {
        title: "Indiquer vos mesures",
        body: "Nous vous guidons étape par étape. Aucun tailleur nécessaire.",
      },
      {
        title: "Confectionné et livré",
        body: "Confectionné à vos mesures et livré chez vous. Avec garantie d'ajustement.",
      },
    ],
    fabricEyebrow: "Matière",
    fabricTitle: "Des tissus de caractère",
    fabricBody:
      "Nous choisissons les tissus pour leur toucher, leur poids et leur durabilité. Chaque détail, de la couture au bouton, vise le confort et la longévité.",
    trustEyebrow: "Qualité",
    trustTitle: "À vos mesures, contrôlé en Suisse",
    trustBody:
      "Chaque pièce est confectionnée à vos mesures et contrôlée en Suisse avant l'envoi. Si quelque chose ne va pas, nous la refaisons : c'est notre garantie d'ajustement.",
    previewHeading: "Nos modèles",
    viewAll: "Voir tous les modèles",
    viewCollection: "Voir la collection",
  },
};

export function getHomeMessages(locale: Locale): HomeMessages {
  return homeCatalog[locale];
}
