# CUTURA Applikations-Review (Stand: 9. Juli 2026)

## 1. Zweck und Methode

Dieses Dokument fasst den vollständigen Applikations-Review vom 9. Juli 2026 zusammen: eine ehrliche Standortbestimmung der neuen Plattform (Storefront, Admin, packages/core, packages/db) vor der weiteren Launch-Vorbereitung.

Vorgehen:

- Fünf Review-Dimensionen: Kundenerlebnis, Admin und Betrieb, Code-Architektur, Sicherheit und Privatsphäre, Performance und Robustheit.
- 19 spezialisierte Agenten: Review-Agenten pro Dimension plus adversariale Verifikations-Agenten, die jedes kritisch oder hoch eingestufte Finding unabhängig gegen Code und Live-Staging geprüft haben.
- Adversariale Verifikation: 14 von 14 kritisch/hoch-Findings bestätigt, 0 widerlegt. Ein Finding (Producer-Mapping-Abdeckung) wurde in der Sache bestätigt, in der Schwere aber herabgestuft, weil der per ADR 0011 beschlossene Freigabefluss die Lücken vor dem Portal-Schritt sichtbar macht.
- 48 Findings insgesamt; neben den 14 kritisch/hoch-Findings 32 mittlere und niedrige.
- Belege: konkrete Code-Stellen (Datei und Zeile) und Live-Prüfungen auf Staging. Der Storefront wurde live begangen (voller Funnel inklusive Damen-Sakko-Massfluss); der Admin wurde als Code reviewt, da er Session-geschützt ist.
- Bekannte, bewusst offene Punkte (Shopify und Resend nicht provisioniert, Platzhalterpreise der Anzüge, Rechtstexte als Entwurf beim Anwalt) wurden nicht erneut als Findings gezählt.

## 2. Management Summary

Das Fundament ist solide. Die adversarialen Prüfungen bestätigten die Architektur-Invarianten im Kern durchgehend: Die Preisberechnung ist tatsächlich server-authoritativ, die Statusmaschine ist serverseitig geschützt, Körpermasse sind AES-256-GCM-verschlüsselt und werden nirgends geloggt, der Shopify-Webhook ist HMAC-geprüft und idempotent, Ownership-Checks decken alle Kundenressourcen ab, die Datenlöschung ist vollständig. Kein Finding stellte eine Invariante als Konzept in Frage.

Das dominante Fehlerbild ist Drift nach dem Katalogwechsel: Die Erweiterung von zwei auf fünf Kleidungstypen (Sakko Herren und Damen, Damenhose) wurde in mehreren Kernpfaden nicht nachgezogen. Beide kritischen Findings gehören in diese Klasse: Die QC-Route kollabierte jeden Kleidungstyp auf Hemd oder Hose, wodurch ein erfasster Sakko-Fail still als Pass gespeichert wurde; und die Mass-Persistenz leitete den Kleidungstyp aus Feldnamen ab, wodurch eingeloggte Kunden Sakko-Masse als Hemdprofil überschrieben und Sakkos gar nicht kaufen konnten. Dieselbe Drift zeigte sich in Inhalten (Massleitfaden ohne Sakko-Anleitung, Fit-Promise-Copy).

18 der 48 Findings wurden noch in der Nacht behoben, darunter beide kritischen und sechs weitere hohe (Commits d2f1fd8, ca0e24d, 50a4646; ein dritter Batch ist implementiert und wird als eigener Commit finalisiert). Kapitel 3 listet sie einzeln.

Eine Grundsatzentscheidung ist offen und kann nur vom Founder getroffen werden: Gilt das Fit-Promise für Sakkos und Blazer? Die Live-Texte widersprechen sich derzeit selbst ("erstes Hemd und erste Hose" gegenüber "erstes Kleidungsstück jeder Art"). Solange das unklar ist, kauft ein Kunde das teuerste Produkt (CHF 349) ohne erkennbares Sicherheitsnetz, und die Rechtstexte können nicht finalisiert werden.

Die wichtigsten offenen Baustellen vor Produktionsstart: das staging-Hardcoding im gesamten Admin-Betrieb (Produktionsbestellungen wären im Admin unsichtbar; blockiert das M9-Abnahmetor), die N+1-Lesepfade (Produktseite mit ~0.9 s TTFB, Admin-Board mit Snapshot-Entschlüsselung pro Position), fehlende Indizes, Security-Header, Fehler-Boundaries und Tests für die Admin-Order-Routen - genau die Schicht, in der der kritische QC-Bug lag.

## 3. Heute behoben

Alle 18 Punkte sind umgesetzt und verifiziert (Commits d2f1fd8, ca0e24d, 50a4646; Batch 3 implementiert, Commit ausstehend).

### Korrektheit (Kleidungstyp-Drift)

- ERLEDIGT QC-Route Kleidungstyp-Kollaps (kritisch): Die Route leitet den Kleidungstyp jetzt wie das Formular über normalizeGarmentType ab; ein Sakko- oder Damenhosen-Fail kann nicht mehr still zum Pass werden. Regressionstests pro Kleidungstyp.
- ERLEDIGT Mass-Persistenz mit explizitem Kleidungstyp (kritisch): Gespeicherte Masse tragen den expliziten Kleidungstyp statt einer Ableitung aus Feldnamen; Sakko-Masse überschreiben kein Hemdprofil mehr, eingeloggte Kunden können Sakkos kaufen.
- ERLEDIGT Gast-Migration und Konto-Routen für alle Kleidungstypen: Login-Migration, Reorder und Profil-Revision arbeiten über die zentrale Kleidungstyp-Registry; Sakko-Felder (Rückenlänge, Sakkolänge) gehen nicht mehr verloren.

### Sicherheit und Geld

- ERLEDIGT Fit-Review-Entscheidung als Whitelist: Unbekannte Werte werden abgelehnt statt als Rückerstattung (der geldbewegende Zweig) ausgeführt.
- ERLEDIGT Fit-Review-Upload erst nach Ownership-Check, mit Rate-Limit: keine verwaisten, nie löschbaren R2-Objekte mehr.
- ERLEDIGT GDPR-Export liefert die aktuelle Mass-Version statt der ältesten.
- ERLEDIGT Freigabe-Guard: Eine Freigabe ohne auflösbaren Produzenten-Kanal (Lieferant plus Adapter oder E-Mail) wird mit klarer Fehlermeldung blockiert statt still durchzulaufen.
- ERLEDIGT Preisvalidierung Basismodelle: Leere oder negative Preise werden abgewiesen statt als 0 Rappen gespeichert.
- ERLEDIGT Rate-Limits auf /api/measurement und /api/price: Die letzten ungeschützten Schreib- und Rechen-Endpunkte sind KV-limitiert.

### Kundenerlebnis

- ERLEDIGT Checkout-Fehler lokalisiert: Fehlercodes werden in allen vier Sprachen übersetzt statt als rohe englische Tokens gezeigt; eigener Zweig für den leeren Warenkorb.
- ERLEDIGT Stille Fehler sichtbar: Fehlgeschlagene Warenkorb- und Mass-Bestätigungen zeigen eine lokalisierte Meldung statt stiller Weiterleitung, die wie Erfolg aussah.
- ERLEDIGT Sprachwechsler behält Query-Parameter: gt, return und q überleben den Sprachwechsel; der Massfluss springt nicht mehr auf Hemdfelder zurück.
- ERLEDIGT Suche findet Kleidungstyp- und Kollektionsnamen: "hemd" und "sakko" liefern jetzt Treffer.

### Admin und Betrieb

- ERLEDIGT Admin-Feedback-Banner: Erfolgs- und Fehlerparameter der Aktionen werden gerendert; ein blockierter Versand ist von einem erfolgreichen unterscheidbar.
- ERLEDIGT Bestätigungs-Dialoge für irreversible Aktionen: Löschen von Katalog-Entitäten, Freigabe und Fit-Review-Entscheid verlangen eine Bestätigung.

### Performance und Robustheit

- ERLEDIGT Middleware-Redirect-Lookup fail-open: Ein transienter D1-Fehler im Redirect-Lookup legt nicht mehr jede Seite lahm.

### Inhalt und Copy

- ERLEDIGT Sakko-Abschnitt im Massleitfaden in vier Sprachen: Anleitung für die neun Sakko-Felder (Herren und Damen), publiziert.
- ERLEDIGT Stoffzusammensetzungen korrigiert: Der "neutral"-Bug auf den Anzug-Produktseiten ist behoben; zehn Stoffe tragen jetzt korrekte Zusammensetzungen.

## 4. Offene Punkte nach Priorität

### 4.1 Founder-Entscheidungen nötig

1. Fit-Promise-Umfang Sakko/Blazer (Aufwand M). Die Fit-Guarantee-Seite deckt "Ihr erstes Hemd und Ihre erste Hose" ab, sagt aber drei Absätze später "gilt für Ihr erstes Kleidungsstück jeder Art"; FAQ und Versandseite wiederholen die enge Fassung. Seit vier Sakko/Blazer-Produkte live sind, ist das ein direkter Widerspruch auf der Seite mit dem zentralen Vertrauensmechanismus, und Massanfertigung kennt kein gesetzliches Widerrufsrecht. Entscheidung: Promise auf Sakkos ausweiten oder Ausschluss explizit machen; danach identische Formulierung auf Fit-Guarantee, FAQ und Versandseite in vier Sprachen.
2. Versandgebiet CH oder CH+LI (Aufwand S). Die Versandseite sagt "Wir liefern in die Schweiz", der Checkout bietet die Schweiz und Liechtenstein an. Der Launch-Entscheid war CH-only. Entscheidung: LI aus dem Checkout entfernen oder auf der Versandseite ergänzen; beide Flächen in einer Änderung angleichen.
3. Englische oder deutsche Produktnamen im deutschen Katalog (Aufwand S). Auf /de/discover tragen die sechs neuen Produkte englische Namen ("Smart Casual Shirt", "Drawstring Trouser"), die vier Anzugsprodukte deutsche; FR und IT haben echte Übersetzungen. Das liest sich unfertig statt als Markenentscheid. Entscheidung: konsequent Englisch überall oder deutsche Namen im de-Katalog; Seed anpassen und neu publizieren.

### 4.2 Vor Produktion nötig

1. environmentDb("staging")-Hardcoding im Admin (hoch, Aufwand M). Rund 30 bis 35 Stellen (Freigabe, Transition, QC, Override, Versand, Listen, Board, Kunden, Fit-Reviews, Lieferanten, Audit, KPIs, CSV-Export) plus MEDIA_STAGING im Freigabe-PDF sind fest auf Staging verdrahtet. Nach Produktionsstart lägen bezahlte Bestellungen in der Produktions-D1 und wären im Admin unsichtbar: keine Prüfung, Freigabe, QC oder Versand möglich. Fix: ein zentraler Betriebs-Kontext (opsDb()/opsMedia()) mit explizitem Umgebungs-Selektor, mechanischer Sweep über alle Stellen. Blockiert das M9-Abnahmetor.
2. Produktseiten-N+1 (hoch, Aufwand M). getPublishedModel führt 13 serielle D1-Queries aus und läuft pro Request doppelt (Metadata und Seite); mit Galerie, Cross-Sell und Empfehlungen sind es ~35 bis 40 Queries, live gemessen 0.85 bis 0.96 s TTFB. Warenkorb und Checkout zahlen dieselben ~13 Queries pro Position; die Landing-Page liest zudem pro Kollektion vierfach dieselben Tabellen. Fix: React cache(), db.batch(), Promise.all, Deduplizierung pro Handle.
3. Admin-Board und KPI-N+1 mit Snapshot-Entschlüsselung (hoch, Aufwand M). Das Pipeline-Board lädt alle Bestellungen unbegrenzt und entschlüsselt pro Position den Snapshot nur für das Ausreisser-Flag; die KPIs scannen zusätzlich mehrere Tabellen. Bei 100 Bestellungen über 250 serielle Queries pro Ansicht, linear wachsend. Fix: Bulk-Fetch mit inArray, Ausreisser-Flag bei der Bestellannahme berechnen und als Spalte speichern, Board zeitlich begrenzen.
4. Fehlende Sekundär-Indizes (mittel, Aufwand S). Nur Unique-Indizes existieren; heisse Zugriffe (Medien pro Entität, Positionen pro Bestellung, Status-Events, Kunden-Bestellungen) sind Full-Table-Scans, und D1 verrechnet rows_read. Fix: eine additive, rollback-sichere Migration mit acht Indizes.
5. Security-Header und CSP (mittel, Aufwand M). Seiten-Antworten tragen weder CSP noch X-Frame-Options, HSTS, Referrer-Policy oder Permissions-Policy (live bestätigt); Tracking-URLs führen ein Token im Pfad. Fix: gemeinsamer headers()-Block in beiden Apps, CSP zunächst report-only. Verteidigungstiefe für eine App mit Adress- und Massdaten.
6. Fehler-Boundaries im Storefront (mittel, Aufwand S). Es gibt kein error.tsx oder global-error.tsx; jede Seite liest D1 im Render-Pfad, ein transienter Fehler zeigt Nexts ungestylte 500-Seite ohne Marke, Sprache oder Rückweg. Fix: lokalisierte error.tsx pro Locale plus minimale global-error.tsx.
7. Tests für die Admin-Order-Routen (mittel, Aufwand M). Der Admin hat drei Unit-Tests und kein E2E; die Routen-Logik (Freigabe-Dispatch, Transition-Validierung, QC-Formular-Mapping) ist ungetestet, und genau dort lag der kritische QC-Bug. Fix: Routen-Logik in reine Funktionen extrahieren und einen Integrationslauf approve -> transition -> qc -> ship für Hemd und Sakko aufsetzen.
8. Kleidungstyp-Fallback auf "shirt" bei fehlender Publish-Abhängigkeit (mittel, Aufwand S). Fehlt beim Publish die Kleidungstyp-Zeile, wird jedes verkaufte Stück still als Hemd in den Snapshot eingefroren (falsche Spezifikation, QC-Checkliste, Ausreisser-Grenzen). Fix: laut scheitern statt degradieren und die Abhängigkeit beim Publizieren erzwingen.

### 4.3 Mittelfristig

1. Mapping-Abdeckungs-Ansicht vor der ersten Bestellung (Aufwand M). Eine Tabelle, welche Modelle, Stoffe, Optionen und Upgrades noch keinen Kutetailor-Code haben, plus Auswahlfeld statt Freitext-Schlüssel gegen Tippfehler. Im adversarialen Check als Ergonomie-Thema eingestuft, da der beschlossene Fluss Lücken nach der Freigabe anzeigt; wertvoll bleibt es vor der ersten echten Bestellung.
2. Rückwärts-Transitionen und problem-Status in der UI (Aufwand M). Die Maschine erlaubt problem, Re-Inspektion nach QC-Fail und awaiting_customer_info, aber keine Oberfläche bietet sie an: Ein Fehlklick ist unumkehrbar, und ein echter Fail hat nur den auditierten Override als Ausweg. Fix: Buttons aus getAllowedTransitions mit Pflicht-Begründung.
3. Trackingnummer beim Versand (Aufwand M). Die Versand-Route übergibt keine Tracking-URL, es gibt kein Eingabefeld, und die Lieferadresse ist nirgends im Admin sichtbar; sie muss pro Paket aus Shopify gesucht werden. Zählt für jede einzelne Sendung.
4. QC-Fotos in der Oberfläche (Aufwand M). submitQc akzeptiert Foto-Schlüssel, das Formular bietet aber keinen Upload; Fails haben keinen Fotobeleg für Lieferanten-Rückfragen und Remake-Fälle, obwohl die Invariante Fotos vorsieht.
5. Wizard-Warnungen internationalisieren (Aufwand M). Die Estimator-Warnungen sind deutsche Literale in packages/core und erscheinen auf EN/FR/IT unübersetzt. Fix: stabile Warncodes im Core, Übersetzung im Storefront.
6. Publish-Drift-Indikator (Aufwand M). Das Publish-Panel sagt immer "Draft"; ob eine Entität je publiziert wurde oder seit dem letzten Publish geändert ist, ist unsichtbar, und der vorhandene Unpublish-Endpoint hat keine UI. Wichtig, sobald die Anzugspreise nach RFQ angepasst werden.
7. Pro-Kleidungstyp-Profile im Konto (Aufwand M). Das Konto zeigt nur ein willkürliches Profil, obwohl das Datenmodell eines pro Kleidungstyp führt; weitere Profile sind unerreichbar, und der Leer-Zustand trägt ein Feldlabel als Titel.
8. Parcel Card pro Kleidungstyp (Aufwand S). Die Karte nutzt nur die erste Position, druckt den rohen internen Schlüssel ("jacket_w") auf eine Kundenkarte und übergibt die Faserzusammensetzung nie, obwohl die Produktregeln sie verlangen. Der Anzug (Sakko plus Hose in einem Paket) ist der Normalfall.
9. Audit-Ansicht für die Control-Plane (Aufwand S). Die Audit-Seite liest nur die Staging-DB; Katalog-Änderungen und Löschungen landen in der Control-DB und sind unsichtbar, obwohl sie auditiert werden. Fix: beide Quellen zusammenführen.
10. Bild-Caching mit ETag (Aufwand S). Bilder sind per Konstruktion unveränderlich, werden aber mit max-age=300 ohne ETag und Edge-Cache ausgeliefert: jede Bildansicht kostet Worker, D1 und R2. Fix: max-age=31536000 immutable plus 304-Handling.
11. pdf-lib aus dem Storefront-Bundle entfernen (Aufwand S). Das Barrel-Export von packages/db zieht pdf-lib in den 6.7-MB-Storefront-Handler, obwohl der Storefront nie PDFs rendert: reiner Cold-Start-Ballast. Fix: Subpath-Export plus sideEffects: false.
12. Caching-Strategie für force-dynamic-Seiten (Aufwand L). Identisches anonymes HTML wird pro Request voll gerendert und neu aus D1 gelesen; ein Traffic-Spike schlägt eins zu eins auf D1 durch. Bewusster M0-Trade-off; bei relevantem Traffic ISR oder Edge-Cache mit Staleness-Entscheid.
13. Unbegrenzte Admin-Listen (Aufwand S). Bestell- und Kundenlisten laden alles mit einer Count-Query pro Zeile. Fix: GROUP BY statt Einzel-Counts plus Limit und Cursor.

## 5. Anhang: alle Findings

| Nr  | Finding                                                                 | Schweregrad | Aufwand | Status            |
| --- | ----------------------------------------------------------------------- | ----------- | ------- | ----------------- |
| 1   | QC-Route kollabiert Kleidungstyp, Fail wird still zum Pass              | kritisch    | S       | ERLEDIGT          |
| 2   | Mass-Persistenz inferiert Kleidungstyp, Sakko korrumpiert Hemdprofil    | kritisch    | M       | ERLEDIGT          |
| 3   | QC-Route Kleidungstyp-Kollaps (Zweitmeldung zu Nr. 1)                   | hoch        | S       | ERLEDIGT          |
| 4   | Freigabe ohne Produzenten-Kanal läuft still durch                       | hoch        | M       | ERLEDIGT          |
| 5   | Irreversible Aktionen ohne Bestätigung (Löschen, Freigabe, Refund)      | hoch        | S       | ERLEDIGT          |
| 6   | Konto-Routen hart auf Hemd+Hose (Gast-Migration, Profilfelder)          | hoch        | S       | ERLEDIGT          |
| 7   | Anzug-Seiten zeigen "neutral" statt Stoffzusammensetzung                | hoch        | S       | ERLEDIGT          |
| 8   | Massleitfaden ohne Sakko-Anleitung                                      | hoch        | M       | ERLEDIGT          |
| 9   | Fit-Promise-Copy widersprüchlich, Sakko-Geltung unklar                  | hoch        | M       | OFFEN (Entscheid) |
| 10  | Admin-Betrieb hart auf environmentDb("staging"), ~35 Stellen            | hoch        | M       | OFFEN             |
| 11  | Produktseite ~35-40 serielle D1-Queries, TTFB ~0.9 s                    | hoch        | M       | OFFEN             |
| 12  | Admin-Board/KPI-N+1 mit Snapshot-Entschlüsselung pro Position           | hoch        | M       | OFFEN             |
| 13  | Keine UI für problem, Re-Inspektion und Rückwärts-Transitionen          | hoch        | M       | OFFEN             |
| 14  | Keine Mapping-Abdeckungs-Ansicht (im Check herabgestuft)                | hoch        | M       | OFFEN             |
| 15  | Admin-Aktions-Feedback (Erfolg/Fehler) nie gerendert                    | mittel      | S       | ERLEDIGT          |
| 16  | Basismodell akzeptiert leeren/negativen Preis (0 Rappen)                | mittel      | S       | ERLEDIGT          |
| 17  | Fit-Review-Entscheid fällt auf Refund zurück                            | mittel      | S       | ERLEDIGT          |
| 18  | /api/measurement ohne Rate-Limit                                        | mittel      | S       | ERLEDIGT          |
| 19  | /api/price ohne Rate-Limit, feuert bei jedem Seitenaufbau               | mittel      | S       | ERLEDIGT          |
| 20  | Checkout-Fehler als rohe englische Tokens                               | mittel      | S       | ERLEDIGT          |
| 21  | Stille Fehler bei Warenkorb und Mass-Bestätigung                        | mittel      | S       | ERLEDIGT          |
| 22  | Sprachwechsler verwirft Query-Parameter                                 | mittel      | S       | ERLEDIGT          |
| 23  | Suche matcht nur Modellnamen ("hemd" ohne Treffer)                      | mittel      | S       | ERLEDIGT          |
| 24  | Middleware-Redirect-Lookup ungeschützt (kein fail-open)                 | mittel      | S       | ERLEDIGT          |
| 25  | Fit-Review-Upload vor Ownership-Check, ohne Rate-Limit                  | niedrig     | S       | ERLEDIGT          |
| 26  | GDPR-Export liefert älteste Mass-Version                                | niedrig     | S       | ERLEDIGT          |
| 27  | Versandseite CH-only, Checkout CH+LI                                    | mittel      | S       | OFFEN (Entscheid) |
| 28  | Deutscher Katalog mischt englische und deutsche Namen                   | mittel      | S       | OFFEN (Entscheid) |
| 29  | Admin-Betrieb staging-Hardcode (Zweitmeldung zu Nr. 10)                 | mittel      | M       | OFFEN             |
| 30  | Keine Sekundär-Indizes (Media, Positionen, Events, Kunden)              | mittel      | S       | OFFEN             |
| 31  | Keine Security-Header (CSP, HSTS, X-Frame-Options)                      | mittel      | M       | OFFEN             |
| 32  | Keine Fehler-Boundaries im Storefront                                   | mittel      | S       | OFFEN             |
| 33  | Keine Tests für Admin-Order-Routen, kein Admin-E2E                      | mittel      | M       | OFFEN             |
| 34  | Kleidungstyp-Fallback "shirt" bei fehlender Publish-Abhängigkeit        | mittel      | S       | OFFEN             |
| 35  | Landing-Page: vierfache Query-Kosten pro Kollektion                     | mittel      | M       | OFFEN             |
| 36  | Audit-Seite zeigt Control-Plane-Audits nicht                            | mittel      | S       | OFFEN             |
| 37  | Kein Publish-/Drift-Indikator, Unpublish ohne UI                        | mittel      | M       | OFFEN             |
| 38  | Versand ohne Trackingnummer, Adresse nicht im Admin                     | mittel      | M       | OFFEN             |
| 39  | QC-Formular ohne Foto-Upload                                            | mittel      | M       | OFFEN             |
| 40  | Wizard-Warnungen nur deutsch auf allen Sprachen                         | mittel      | M       | OFFEN             |
| 41  | Konto zeigt nur ein willkürliches Profil, Leer-Titel ist Feldlabel      | mittel      | M       | OFFEN             |
| 42  | Parcel Card: nur erste Position, roher Schlüssel, keine Zusammensetzung | mittel      | S       | OFFEN             |
| 43  | Bilder: 5-Minuten-Cache, kein ETag, kein Edge-Cache                     | mittel      | S       | OFFEN             |
| 44  | pdf-lib im Storefront-Bundle (6.7-MB-Handler)                           | mittel      | S       | OFFEN             |
| 45  | force-dynamic ohne Cache-Strategie für anonyme Seiten                   | niedrig     | L       | OFFEN             |
| 46  | Unbegrenzte Admin-Listen mit Count-Query pro Zeile                      | niedrig     | S       | OFFEN             |

Anmerkung: Die Nummern 3 und 29 sind Zweitmeldungen unabhängiger Review-Agenten zu denselben Sachverhalten wie Nr. 1 und Nr. 10; sie sind hier der Vollständigkeit halber aufgeführt.
