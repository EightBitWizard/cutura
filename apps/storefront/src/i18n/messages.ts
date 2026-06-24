// Minimal typed message catalog for static customer-facing UI copy. Catalog
// content (model/fabric names etc.) is localized in the DB via localize(); this
// covers the chrome (buttons, labels, notices). German is the fallback. Extended
// per workstream across M3; the full i18n milestone (M-i18n) replaces this with a
// richer setup.

import type { CustomerMilestone } from "@cutura/core";

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
  },
  en: {
    ordersTitle: "Orders",
    viewOrder: "View",
    trackingTitle: "Order tracking",
    empty: "No orders yet.",
    orderNumber: "Order number",
    fitReview: "Report a fit issue",
    feedback: "Give feedback",
  },
  it: {
    ordersTitle: "Ordini",
    viewOrder: "Vedi",
    trackingTitle: "Tracciamento ordine",
    empty: "Nessun ordine.",
    orderNumber: "Numero ordine",
    fitReview: "Segnala un problema di vestibilita",
    feedback: "Lascia un feedback",
  },
  fr: {
    ordersTitle: "Commandes",
    viewOrder: "Voir",
    trackingTitle: "Suivi de commande",
    empty: "Aucune commande.",
    orderNumber: "Numero de commande",
    fitReview: "Signaler un probleme de coupe",
    feedback: "Donner un avis",
  },
};

export function getOrderMessages(locale: Locale): OrderMessages {
  return orderCatalog[locale];
}
