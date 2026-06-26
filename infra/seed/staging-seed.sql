-- Staging seed: a minimal, valid starter catalog for the Staging environment.
-- Idempotent (INSERT OR IGNORE on fixed ids), so it can be re-applied safely.
-- Apply with: wrangler d1 execute cutura-staging --env staging --remote --file=infra/seed/staging-seed.sql
-- Expand this as the catalog admin (M2) and the vertical slice (M3) land.

-- Garment type: shirt
INSERT OR IGNORE INTO garment_type (id, key, name_i18n, measurement_schema_id, created_at, updated_at)
VALUES ('gt_shirt', 'shirt', '{"de":"Hemd","en":"Shirt","it":"Camicia","fr":"Chemise"}', 'ms_shirt', '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');

INSERT OR IGNORE INTO measurement_schema (id, garment_type_id, version, fields, created_at, updated_at)
VALUES ('ms_shirt', 'gt_shirt', 1, '{"core":["chest","waist","neck"],"units":"cm"}', '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');

-- Default supplier
INSERT OR IGNORE INTO supplier (id, name, is_default, created_at, updated_at)
VALUES ('sup_default', 'Default Tailor', 1, '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');

-- Base model: Oxford business shirt
INSERT OR IGNORE INTO base_model (id, garment_type_id, handle, name_i18n, base_price_minor, lead_time_min_days, lead_time_max_days, status, created_at, updated_at)
VALUES ('bm_oxford', 'gt_shirt', 'oxford-business', '{"de":"Oxford Business","en":"Oxford Business","it":"Oxford Business","fr":"Oxford Business"}', 12900, 21, 35, 'orderable', '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');

-- Fabrics
INSERT OR IGNORE INTO fabric (id, code, name_i18n, surcharge_minor, available, created_at, updated_at)
VALUES ('fab_white', 'OXF-WHT-01', '{"de":"Oxford Weiss","en":"Oxford White","it":"Oxford Bianco","fr":"Oxford Blanc"}', 0, 1, '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');
INSERT OR IGNORE INTO fabric (id, code, name_i18n, surcharge_minor, available, created_at, updated_at)
VALUES ('fab_blue', 'OXF-BLU-01', '{"de":"Oxford Blau","en":"Oxford Blue","it":"Oxford Blu","fr":"Oxford Bleu"}', 2000, 1, '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');

-- Option group: collar
INSERT OR IGNORE INTO option_group (id, garment_type_id, code, label_i18n, created_at, updated_at)
VALUES ('og_collar', 'gt_shirt', 'collar', '{"de":"Kragen","en":"Collar","it":"Colletto","fr":"Col"}', '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');
INSERT OR IGNORE INTO option_value (id, option_group_id, code, label_i18n, surcharge_minor, created_at, updated_at)
VALUES ('ov_spread', 'og_collar', 'spread', '{"de":"Spread","en":"Spread","it":"Spread","fr":"Italien"}', 0, '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');
INSERT OR IGNORE INTO option_value (id, option_group_id, code, label_i18n, surcharge_minor, created_at, updated_at)
VALUES ('ov_button_down', 'og_collar', 'button_down', '{"de":"Button-Down","en":"Button-Down","it":"Button-Down","fr":"Boutonne"}', 500, '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');

-- Per-model allow-lists
INSERT OR IGNORE INTO model_allowed_fabric (id, base_model_id, fabric_id, position) VALUES ('maf_white', 'bm_oxford', 'fab_white', 0);
INSERT OR IGNORE INTO model_allowed_fabric (id, base_model_id, fabric_id, position) VALUES ('maf_blue', 'bm_oxford', 'fab_blue', 1);
INSERT OR IGNORE INTO model_allowed_option (id, base_model_id, option_group_id, required, position) VALUES ('mao_collar', 'bm_oxford', 'og_collar', 1, 0);

-- Garment type: trouser (added as DATA + the registered estimator module; FR-104).
INSERT OR IGNORE INTO garment_type (id, key, name_i18n, measurement_schema_id, created_at, updated_at)
VALUES ('gt_trouser', 'trouser', '{"de":"Hose","en":"Trousers","it":"Pantaloni","fr":"Pantalon"}', 'ms_trouser', '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');

INSERT OR IGNORE INTO measurement_schema (id, garment_type_id, version, fields, created_at, updated_at)
VALUES ('ms_trouser', 'gt_trouser', 1, '{"core":["waist","hips","inseam"],"units":"cm"}', '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');

-- Base model: classic chino
INSERT OR IGNORE INTO base_model (id, garment_type_id, handle, name_i18n, base_price_minor, lead_time_min_days, lead_time_max_days, status, created_at, updated_at)
VALUES ('bm_chino', 'gt_trouser', 'chino-classic', '{"de":"Chino Classic","en":"Chino Classic","it":"Chino Classic","fr":"Chino Classic"}', 14900, 21, 35, 'orderable', '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');

-- Trouser fabrics (with fibre composition + care, carried to the PDP + the sewn-in label)
INSERT OR IGNORE INTO fabric (id, code, name_i18n, fibre_composition, care_data, surcharge_minor, available, created_at, updated_at)
VALUES ('fab_chino_navy', 'CHN-NAV-01', '{"de":"Chino Marine","en":"Chino Navy","it":"Chino Blu","fr":"Chino Marine"}', '{"cotton":98,"elastane":2}', '["30C","no bleach","iron medium"]', 0, 1, '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');
INSERT OR IGNORE INTO fabric (id, code, name_i18n, fibre_composition, care_data, surcharge_minor, available, created_at, updated_at)
VALUES ('fab_chino_stone', 'CHN-STN-01', '{"de":"Chino Stein","en":"Chino Stone","it":"Chino Sabbia","fr":"Chino Pierre"}', '{"cotton":100}', '["30C","no bleach","iron medium"]', 1500, 1, '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');

-- Option group: pleats
INSERT OR IGNORE INTO option_group (id, garment_type_id, code, label_i18n, created_at, updated_at)
VALUES ('og_pleats', 'gt_trouser', 'pleats', '{"de":"Bundfalten","en":"Pleats","it":"Pince","fr":"Pinces"}', '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');
INSERT OR IGNORE INTO option_value (id, option_group_id, code, label_i18n, surcharge_minor, created_at, updated_at)
VALUES ('ov_flat_front', 'og_pleats', 'flat_front', '{"de":"Ohne Bundfalten","en":"Flat front","it":"Senza pince","fr":"Sans pinces"}', 0, '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');
INSERT OR IGNORE INTO option_value (id, option_group_id, code, label_i18n, surcharge_minor, created_at, updated_at)
VALUES ('ov_single_pleat', 'og_pleats', 'single_pleat', '{"de":"Eine Bundfalte","en":"Single pleat","it":"Una pince","fr":"Une pince"}', 500, '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');

-- Trouser allow-lists
INSERT OR IGNORE INTO model_allowed_fabric (id, base_model_id, fabric_id, position) VALUES ('maf_chino_navy', 'bm_chino', 'fab_chino_navy', 0);
INSERT OR IGNORE INTO model_allowed_fabric (id, base_model_id, fabric_id, position) VALUES ('maf_chino_stone', 'bm_chino', 'fab_chino_stone', 1);
INSERT OR IGNORE INTO model_allowed_option (id, base_model_id, option_group_id, required, position) VALUES ('mao_pleats', 'bm_chino', 'og_pleats', 1, 0);

-- Curated cross-sell: shirt <-> trousers (complete the outfit; FR-1110)
INSERT OR IGNORE INTO cross_sell_rule (id, source_type, source_key, suggested_model_id, position, created_at, updated_at)
VALUES ('xsell_shirt_chino', 'model', 'oxford-business', 'bm_chino', 0, '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');
INSERT OR IGNORE INTO cross_sell_rule (id, source_type, source_key, suggested_model_id, position, created_at, updated_at)
VALUES ('xsell_chino_shirt', 'model', 'chino-classic', 'bm_oxford', 0, '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');

-- Shipping (Switzerland and Liechtenstein; standard included in the price)
INSERT OR IGNORE INTO shipping_zone (id, name, countries, created_at, updated_at)
VALUES ('sz_ch_li', 'Switzerland and Liechtenstein', '["CH","LI"]', '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');
INSERT OR IGNORE INTO shipping_method (id, zone_id, code, price_minor, kind, included_in_price, created_at, updated_at)
VALUES ('sm_standard', 'sz_ch_li', 'standard', 0, 'standard', 1, '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');

-- Config: capacity cap and pause state
INSERT OR IGNORE INTO config (key, value, updated_at) VALUES ('capacity_cap', '{"maxOpenOrders":50}', '2026-06-24T00:00:00Z');
INSERT OR IGNORE INTO config (key, value, updated_at) VALUES ('pause', '{"active":false,"message":""}', '2026-06-24T00:00:00Z');

-- Content + legal pages (placeholder copy; final legal text + lawyer sign-off in M7).
INSERT OR IGNORE INTO content_page (id, slug, kind, title_i18n, body_i18n, version, created_at, updated_at)
VALUES ('cp_about', 'about', 'content', '{"de":"Ueber CUTURA","en":"About CUTURA","it":"Chi siamo","fr":"A propos"}', '{"de":"Massgefertigte Kleidung aus der Schweiz.","en":"Made-to-measure clothing from Switzerland.","it":"Abbigliamento su misura dalla Svizzera.","fr":"Vetements sur mesure de Suisse."}', 1, '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');
INSERT OR IGNORE INTO content_page (id, slug, kind, title_i18n, body_i18n, version, created_at, updated_at)
VALUES ('cp_faq', 'faq', 'content', '{"de":"Haeufige Fragen","en":"FAQ","it":"Domande frequenti","fr":"FAQ"}', '{"de":"Antworten auf haeufige Fragen folgen.","en":"Answers to common questions are coming.","it":"Le risposte alle domande comuni sono in arrivo.","fr":"Les reponses aux questions frequentes arrivent."}', 1, '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');
INSERT OR IGNORE INTO content_page (id, slug, kind, title_i18n, body_i18n, version, created_at, updated_at)
VALUES ('cp_fit_guide', 'fit-guide', 'content', '{"de":"Passform- und Massleitfaden","en":"Fit and size guide","it":"Guida a vestibilita e misure","fr":"Guide des tailles et coupes"}', '{"de":"So messen Sie richtig.","en":"How to measure correctly.","it":"Come misurare correttamente.","fr":"Comment bien mesurer."}', 1, '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');

-- Legal pages. Placeholder copy ONLY: shipping/fit-guarantee describe actual system
-- behaviour; terms/imprint/privacy state intent + explicit [to be completed] fields.
-- Final legal text, real company data, and lawyer sign-off are required before launch
-- (see docs/COMPLIANCE.md). No fabricated citations.
INSERT OR IGNORE INTO content_page (id, slug, kind, title_i18n, body_i18n, version, created_at, updated_at)
VALUES ('cp_terms', 'terms', 'legal', '{"de":"AGB","en":"Terms","it":"Termini","fr":"Conditions"}', '{"de":"Die vollstaendigen AGB werden nach juristischer Pruefung veroeffentlicht.","en":"The full terms will be published after legal review.","it":"I termini completi saranno pubblicati dopo la revisione legale.","fr":"Les conditions completes seront publiees apres revision juridique."}', 1, '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');
INSERT OR IGNORE INTO content_page (id, slug, kind, title_i18n, body_i18n, version, created_at, updated_at)
VALUES ('cp_privacy', 'privacy', 'legal', '{"de":"Datenschutz","en":"Privacy","it":"Privacy","fr":"Confidentialite"}', '{"de":"Wir minimieren Daten, verschluesseln Koerpermasse und erfuellen Loesch- und Auskunftsrechte. Die vollstaendige Erklaerung folgt nach juristischer Pruefung.","en":"We minimize data, encrypt body measurements, and honor deletion and access rights. The full policy follows after legal review.","it":"Minimizziamo i dati, cifriamo le misure corporee e rispettiamo i diritti di cancellazione e accesso. La policy completa segue dopo la revisione legale.","fr":"Nous minimisons les donnees, chiffrons les mesures corporelles et respectons les droits de suppression et d acces. La politique complete suit apres revision juridique."}', 1, '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');
INSERT OR IGNORE INTO content_page (id, slug, kind, title_i18n, body_i18n, version, created_at, updated_at)
VALUES ('cp_imprint', 'imprint', 'legal', '{"de":"Impressum","en":"Imprint","it":"Note legali","fr":"Mentions legales"}', '{"de":"Firma: [zu ergaenzen]. Adresse: [zu ergaenzen]. Kontakt: [zu ergaenzen]. UID: [zu ergaenzen].","en":"Company: [to be completed]. Address: [to be completed]. Contact: [to be completed]. UID: [to be completed].","it":"Azienda: [da completare]. Indirizzo: [da completare]. Contatto: [da completare]. UID: [da completare].","fr":"Societe: [a completer]. Adresse: [a completer]. Contact: [a completer]. UID: [a completer]."}', 1, '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');
INSERT OR IGNORE INTO content_page (id, slug, kind, title_i18n, body_i18n, version, created_at, updated_at)
VALUES ('cp_shipping', 'shipping', 'legal', '{"de":"Versand","en":"Shipping","it":"Spedizione","fr":"Livraison"}', '{"de":"Wir liefern in die Schweiz und nach Liechtenstein. Standardversand ist im angezeigten Preis enthalten. Lieferzeiten stehen beim Produkt.","en":"We ship to Switzerland and Liechtenstein. Standard shipping is included in the displayed price. Lead times are shown on each product.","it":"Spediamo in Svizzera e Liechtenstein. La spedizione standard e inclusa nel prezzo indicato. I tempi di consegna sono indicati su ogni prodotto.","fr":"Nous livrons en Suisse et au Liechtenstein. La livraison standard est incluse dans le prix affiche. Les delais figurent sur chaque produit."}', 1, '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');
INSERT OR IGNORE INTO content_page (id, slug, kind, title_i18n, body_i18n, version, created_at, updated_at)
VALUES ('cp_fit_guarantee', 'fit-guarantee', 'legal', '{"de":"Passform-Garantie","en":"Fit guarantee","it":"Garanzia di vestibilita","fr":"Garantie d ajustement"}', '{"de":"Stimmt die Passform nicht, fertigen wir das Stueck zuerst neu an. Loest eine Neuanfertigung es nicht, ist eine Rueckerstattung moeglich. Das Original behalten Sie zum Start.","en":"If the fit is not right, we remake the garment first. If a remake does not resolve it, a refund is available. You keep the original at launch.","it":"Se la vestibilita non e corretta, rifacciamo prima il capo. Se il rifacimento non risolve, e possibile un rimborso. Allinizio tieni loriginale.","fr":"Si la coupe ne convient pas, nous refaisons d abord le vetement. Si une refabrication ne resout pas le probleme, un remboursement est possible. Vous gardez l original au lancement."}', 1, '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');

-- ---------------------------------------------------------------------------
-- Additional options (2026-06-25): shirt sleeve; trouser side pockets, back
-- pockets (optional), and closure; plus a double-pleat value. Idempotent
-- (INSERT OR IGNORE, fixed ids). Applied to cutura-control AND cutura-staging.
-- The founder adds a picture per value in the admin, then publishes.
-- ---------------------------------------------------------------------------

-- Shirt: sleeve (required)
INSERT OR IGNORE INTO option_group (id, garment_type_id, code, label_i18n, created_at, updated_at)
VALUES ('og_sleeve', 'gt_shirt', 'sleeve', '{"de":"Ärmel","en":"Sleeve","it":"Manica","fr":"Manche"}', '2026-06-25T00:00:00Z', '2026-06-25T00:00:00Z');
INSERT OR IGNORE INTO option_value (id, option_group_id, code, label_i18n, surcharge_minor, created_at, updated_at)
VALUES ('ov_sleeve_long', 'og_sleeve', 'long', '{"de":"Langarm","en":"Long sleeve","it":"Manica lunga","fr":"Manches longues"}', 0, '2026-06-25T00:00:00Z', '2026-06-25T00:00:00Z');
INSERT OR IGNORE INTO option_value (id, option_group_id, code, label_i18n, surcharge_minor, created_at, updated_at)
VALUES ('ov_sleeve_short', 'og_sleeve', 'short', '{"de":"Kurzarm","en":"Short sleeve","it":"Manica corta","fr":"Manches courtes"}', 0, '2026-06-25T00:00:00Z', '2026-06-25T00:00:00Z');
INSERT OR IGNORE INTO model_allowed_option (id, base_model_id, option_group_id, required, position)
VALUES ('mao_oxford_sleeve', 'bm_oxford', 'og_sleeve', 1, 1);

-- Trouser: side pockets (required)
INSERT OR IGNORE INTO option_group (id, garment_type_id, code, label_i18n, created_at, updated_at)
VALUES ('og_side_pockets', 'gt_trouser', 'side_pockets', '{"de":"Seitentaschen","en":"Side pockets","it":"Tasche laterali","fr":"Poches latérales"}', '2026-06-25T00:00:00Z', '2026-06-25T00:00:00Z');
INSERT OR IGNORE INTO option_value (id, option_group_id, code, label_i18n, surcharge_minor, created_at, updated_at)
VALUES ('ov_side_slant', 'og_side_pockets', 'slanted', '{"de":"Schräge Tasche","en":"Slanted","it":"Tasca obliqua","fr":"Poche oblique"}', 0, '2026-06-25T00:00:00Z', '2026-06-25T00:00:00Z');
INSERT OR IGNORE INTO option_value (id, option_group_id, code, label_i18n, surcharge_minor, created_at, updated_at)
VALUES ('ov_side_straight', 'og_side_pockets', 'straight', '{"de":"Gerade Tasche","en":"Straight","it":"Tasca verticale","fr":"Poche droite"}', 0, '2026-06-25T00:00:00Z', '2026-06-25T00:00:00Z');
INSERT OR IGNORE INTO model_allowed_option (id, base_model_id, option_group_id, required, position)
VALUES ('mao_chino_side', 'bm_chino', 'og_side_pockets', 1, 1);

-- Trouser: back pockets (optional; the configurator offers a "None" choice)
INSERT OR IGNORE INTO option_group (id, garment_type_id, code, label_i18n, created_at, updated_at)
VALUES ('og_back_pockets', 'gt_trouser', 'back_pockets', '{"de":"Gesässtaschen","en":"Back pockets","it":"Tasche posteriori","fr":"Poches arrière"}', '2026-06-25T00:00:00Z', '2026-06-25T00:00:00Z');
INSERT OR IGNORE INTO option_value (id, option_group_id, code, label_i18n, surcharge_minor, created_at, updated_at)
VALUES ('ov_back_welt', 'og_back_pockets', 'welt', '{"de":"Paspeltasche","en":"Welt pocket","it":"Tasca profilata","fr":"Poche passepoilée"}', 0, '2026-06-25T00:00:00Z', '2026-06-25T00:00:00Z');
INSERT OR IGNORE INTO option_value (id, option_group_id, code, label_i18n, surcharge_minor, created_at, updated_at)
VALUES ('ov_back_button', 'og_back_pockets', 'button_welt', '{"de":"Paspeltasche mit Knopf","en":"Button-through welt","it":"Tasca con bottone","fr":"Poche à bouton"}', 500, '2026-06-25T00:00:00Z', '2026-06-25T00:00:00Z');
INSERT OR IGNORE INTO option_value (id, option_group_id, code, label_i18n, surcharge_minor, created_at, updated_at)
VALUES ('ov_back_patch', 'og_back_pockets', 'patch', '{"de":"Aufgesetzte Tasche","en":"Patch pocket","it":"Tasca applicata","fr":"Poche plaquée"}', 0, '2026-06-25T00:00:00Z', '2026-06-25T00:00:00Z');
INSERT OR IGNORE INTO model_allowed_option (id, base_model_id, option_group_id, required, position)
VALUES ('mao_chino_back', 'bm_chino', 'og_back_pockets', 0, 2);

-- Trouser: closure (required)
INSERT OR IGNORE INTO option_group (id, garment_type_id, code, label_i18n, created_at, updated_at)
VALUES ('og_closure', 'gt_trouser', 'closure', '{"de":"Verschluss","en":"Closure","it":"Chiusura","fr":"Fermeture"}', '2026-06-25T00:00:00Z', '2026-06-25T00:00:00Z');
INSERT OR IGNORE INTO option_value (id, option_group_id, code, label_i18n, surcharge_minor, created_at, updated_at)
VALUES ('ov_closure_zip', 'og_closure', 'zip', '{"de":"Reissverschluss","en":"Zip fly","it":"Cerniera","fr":"Braguette zippée"}', 0, '2026-06-25T00:00:00Z', '2026-06-25T00:00:00Z');
INSERT OR IGNORE INTO option_value (id, option_group_id, code, label_i18n, surcharge_minor, created_at, updated_at)
VALUES ('ov_closure_button', 'og_closure', 'button', '{"de":"Knopfleiste","en":"Button fly","it":"Bottoni","fr":"Braguette boutonnée"}', 500, '2026-06-25T00:00:00Z', '2026-06-25T00:00:00Z');
INSERT OR IGNORE INTO model_allowed_option (id, base_model_id, option_group_id, required, position)
VALUES ('mao_chino_closure', 'bm_chino', 'og_closure', 1, 3);

-- Trouser: double pleat (two folds), added to the existing pleats group
INSERT OR IGNORE INTO option_value (id, option_group_id, code, label_i18n, surcharge_minor, created_at, updated_at)
VALUES ('ov_double_pleat', 'og_pleats', 'double_pleat', '{"de":"Zwei Bundfalten","en":"Double pleat","it":"Due pince","fr":"Deux pinces"}', 1000, '2026-06-25T00:00:00Z', '2026-06-25T00:00:00Z');

-- Riviera + Linen catalog (added 2026-06-26). Authored as drafts; the founder sets real
-- prices/images, flips status to orderable, and publishes. Prices are placeholders copied
-- from the existing shirt/trouser defaults. Em dashes normalized to hyphens (house rule).

-- Fabrics: three Riviera colours (no composition stated) + white linen.
INSERT OR IGNORE INTO fabric (id, code, name_i18n, description_i18n, surcharge_minor, available, created_at, updated_at)
VALUES ('fab_riv_tobacco', 'RIV-TOB-01', '{"de":"Riviera Tabak","en":"Riviera Tobacco","it":"Riviera tabacco","fr":"Riviera tabac"}', '{"de":"Ruhiger, warmer Tabakton fuer sommerliche Hemden und Hosen. Teil der Riviera-Stofffamilie.","en":"A quiet warm tobacco tone for summer shirts and trousers. Part of the Riviera fabric family.","fr":"Une teinte tabac chaude et sobre pour chemises et pantalons d’été. Fait partie de la famille de tissus Riviera.","it":"Una tonalità tabacco calda e sobria per camicie e pantaloni estivi. Parte della famiglia di tessuti Riviera."}', 0, 1, '2026-06-26T00:00:00Z', '2026-06-26T00:00:00Z');
INSERT OR IGNORE INTO fabric (id, code, name_i18n, description_i18n, surcharge_minor, available, created_at, updated_at)
VALUES ('fab_riv_olive', 'RIV-OLV-01', '{"de":"Riviera Oliv","en":"Riviera Olive","it":"Riviera oliva","fr":"Riviera olive"}', '{"de":"Ein dezenter Olivton fuer entspannte, sommerliche Looks. Teil der Riviera-Stofffamilie.","en":"A muted olive tone for relaxed summer looks. Part of the Riviera fabric family.","fr":"Une teinte olive discrète pour des tenues estivales détendues. Fait partie de la famille de tissus Riviera.","it":"Una tonalità oliva discreta per look estivi rilassati. Parte della famiglia di tessuti Riviera."}', 0, 1, '2026-06-26T00:00:00Z', '2026-06-26T00:00:00Z');
INSERT OR IGNORE INTO fabric (id, code, name_i18n, description_i18n, surcharge_minor, available, created_at, updated_at)
VALUES ('fab_riv_sand', 'RIV-SND-01', '{"de":"Riviera Sand","en":"Riviera Sand","it":"Riviera sabbia","fr":"Riviera sable"}', '{"de":"Ein heller, neutraler Sandton fuer warme Tage und ruhige Kombinationen. Teil der Riviera-Stofffamilie.","en":"A light neutral sand tone for warm days and calm combinations. Part of the Riviera fabric family.","fr":"Une teinte sable claire et neutre pour les journées chaudes et les associations sobres. Fait partie de la famille de tissus Riviera.","it":"Una tonalità sabbia chiara e neutra per giornate calde e abbinamenti sobri. Parte della famiglia di tessuti Riviera."}', 0, 1, '2026-06-26T00:00:00Z', '2026-06-26T00:00:00Z');
INSERT OR IGNORE INTO fabric (id, code, name_i18n, description_i18n, material, fibre_composition, surcharge_minor, available, created_at, updated_at)
VALUES ('fab_lin_white', 'LIN-WHT-01', '{"de":"Leinen Weiss","en":"White Linen","it":"Lino bianco","fr":"Lin blanc"}', '{"de":"Weisses Leinen mit natuerlicher Struktur, leichtem Griff und sommerlichem Charakter.","en":"White linen with a natural texture, lightweight feel, and summer-ready character.","fr":"Lin blanc à la texture naturelle, au toucher léger et au caractère estival.","it":"Lino bianco con texture naturale, mano leggera e carattere estivo."}', 'Linen', '{"linen":100}', 0, 1, '2026-06-26T00:00:00Z', '2026-06-26T00:00:00Z');

-- Base models (draft; placeholder prices; lead time 21/35).
INSERT OR IGNORE INTO base_model (id, garment_type_id, handle, name_i18n, description_i18n, base_price_minor, lead_time_min_days, lead_time_max_days, status, created_at, updated_at)
VALUES ('bm_riviera_shirt', 'gt_shirt', 'riviera-camp-shirt', '{"de":"Riviera Camp Shirt","en":"Riviera Camp Shirt","it":"Camicia Riviera Camp","fr":"Chemise Riviera Camp"}', '{"de":"Das Riviera Camp Shirt ist ein leichtes, kurzärmeliges Hemd für warme Tage. Der offene Kragen, die klare Knopfleiste und die entspannte Passform machen es vielseitig tragbar - casual mit Shorts oder sauber kombiniert mit Chino. Nach deinen Massen gefertigt und in mehreren ruhigen Farben erhältlich.","en":"The Riviera Camp Shirt is a lightweight short-sleeve shirt designed for warm days. Its open collar, clean button front, and relaxed fit make it easy to wear casually or dressed up with tailored trousers. Made to your measurements and available in a refined range of quiet colors.","fr":"La chemise Riviera Camp est une chemise légère à manches courtes pensée pour les journées chaudes. Son col ouvert, sa patte de boutonnage épurée et sa coupe détendue la rendent facile à porter, aussi bien avec un short qu’avec un pantalon chino. Confectionnée selon vos mesures et disponible dans une sélection de couleurs sobres.","it":"La Camicia Riviera Camp è una camicia leggera a maniche corte pensata per le giornate calde. Il collo aperto, l’abbottonatura pulita e la vestibilità rilassata la rendono facile da indossare sia in modo casual sia con pantaloni chino. Realizzata sulle tue misure e disponibile in una selezione di colori sobri."}', 12900, 21, 35, 'draft', '2026-06-26T00:00:00Z', '2026-06-26T00:00:00Z');
INSERT OR IGNORE INTO base_model (id, garment_type_id, handle, name_i18n, description_i18n, base_price_minor, lead_time_min_days, lead_time_max_days, status, created_at, updated_at)
VALUES ('bm_riviera_trouser', 'gt_trouser', 'riviera-drawstring-trouser', '{"de":"Riviera Drawstring Trouser","en":"Riviera Drawstring Trouser","it":"Pantalone Riviera con coulisse","fr":"Pantalon Riviera à cordon"}', '{"de":"Die Riviera Drawstring Trouser verbindet den Komfort einer lockeren Sommerhose mit der sauberen Linie einer massgefertigten Hose. Der elastische Bund mit Kordelzug sorgt für Bewegungsfreiheit, während das gerade Bein ruhig und gepflegt wirkt. Ideal für warme Tage, Reisen und entspannte Smart-Casual-Looks - allein getragen oder kombiniert mit dem passenden Riviera Camp Shirt.","en":"The Riviera Drawstring Trouser combines the comfort of a relaxed summer pant with the clean look of a made-to-measure trouser. The elastic waistband and drawstring offer easy movement, while the straight leg keeps the silhouette refined and understated. Designed for warm days, travel, and relaxed smart-casual dressing - worn on its own or paired with the matching Riviera Camp Shirt.","fr":"Le Pantalon Riviera à cordon associe le confort d’un pantalon d’été décontracté à la ligne soignée d’un vêtement sur mesure. La taille élastique avec cordon offre une grande liberté de mouvement, tandis que la jambe droite conserve une silhouette élégante et discrète. Pensé pour les journées chaudes, les voyages et les tenues smart casual détendues - seul ou avec la Chemise Riviera Camp assortie.","it":"Il Pantalone Riviera con coulisse unisce il comfort di un pantalone estivo rilassato alla linea pulita di un capo su misura. La vita elasticizzata con coulisse offre libertà di movimento, mentre la gamba dritta mantiene una silhouette curata e discreta. Pensato per le giornate calde, i viaggi e un abbigliamento smart casual rilassato - da solo o abbinato alla Camicia Riviera Camp."}', 14900, 21, 35, 'draft', '2026-06-26T00:00:00Z', '2026-06-26T00:00:00Z');
INSERT OR IGNORE INTO base_model (id, garment_type_id, handle, name_i18n, description_i18n, base_price_minor, lead_time_min_days, lead_time_max_days, status, created_at, updated_at)
VALUES ('bm_linen_shirt', 'gt_shirt', 'linen-essential-shirt', '{"de":"Linen Essential Shirt","en":"Linen Essential Shirt","it":"Camicia Essential in lino","fr":"Chemise Essential en lin"}', '{"de":"Das Linen Essential Shirt ist ein klassisches Leinenhemd für warme Tage und ruhige, gepflegte Looks. Der leichte Stoff, die natürliche Struktur und die klare Silhouette machen es vielseitig tragbar: offen über einem T-Shirt, sauber kombiniert mit Chino oder entspannt zu einer Sommerhose. Nach deinen Massen gefertigt und bewusst schlicht gehalten.","en":"The Linen Essential Shirt is a classic linen shirt designed for warm days and understated dressing. Its lightweight fabric, natural texture, and clean silhouette make it easy to wear open over a T-shirt, paired with chinos, or styled casually with relaxed summer trousers. Made to your measurements and kept deliberately simple.","fr":"La Chemise Essential en lin est une chemise classique pensée pour les journées chaudes et les tenues sobres. Son tissu léger, sa texture naturelle et sa silhouette épurée la rendent facile à porter ouverte sur un T-shirt, avec un chino ou avec un pantalon d’été plus détendu. Confectionnée selon vos mesures et volontairement simple.","it":"La Camicia Essential in lino è una camicia classica pensata per le giornate calde e per uno stile sobrio. Il tessuto leggero, la texture naturale e la linea pulita la rendono facile da indossare aperta sopra una T-shirt, con un chino o con pantaloni estivi rilassati. Realizzata sulle tue misure e volutamente essenziale."}', 12900, 21, 35, 'draft', '2026-06-26T00:00:00Z', '2026-06-26T00:00:00Z');

-- Allowed fabrics: Riviera shirt + trouser allow the three Riviera colours; linen shirt allows white linen.
INSERT OR IGNORE INTO model_allowed_fabric (id, base_model_id, fabric_id, position) VALUES ('maf_riv_shirt_tob', 'bm_riviera_shirt', 'fab_riv_tobacco', 0);
INSERT OR IGNORE INTO model_allowed_fabric (id, base_model_id, fabric_id, position) VALUES ('maf_riv_shirt_olv', 'bm_riviera_shirt', 'fab_riv_olive', 1);
INSERT OR IGNORE INTO model_allowed_fabric (id, base_model_id, fabric_id, position) VALUES ('maf_riv_shirt_snd', 'bm_riviera_shirt', 'fab_riv_sand', 2);
INSERT OR IGNORE INTO model_allowed_fabric (id, base_model_id, fabric_id, position) VALUES ('maf_riv_trs_tob', 'bm_riviera_trouser', 'fab_riv_tobacco', 0);
INSERT OR IGNORE INTO model_allowed_fabric (id, base_model_id, fabric_id, position) VALUES ('maf_riv_trs_olv', 'bm_riviera_trouser', 'fab_riv_olive', 1);
INSERT OR IGNORE INTO model_allowed_fabric (id, base_model_id, fabric_id, position) VALUES ('maf_riv_trs_snd', 'bm_riviera_trouser', 'fab_riv_sand', 2);
INSERT OR IGNORE INTO model_allowed_fabric (id, base_model_id, fabric_id, position) VALUES ('maf_lin_shirt_white', 'bm_linen_shirt', 'fab_lin_white', 0);

-- Riviera collection + members (not featured on landing by default).
INSERT OR IGNORE INTO collection (id, handle, name_i18n, description_i18n, created_at, updated_at)
VALUES ('col_riviera', 'riviera', '{"de":"Riviera","en":"Riviera","it":"Riviera","fr":"Riviera"}', '{"de":"Leichte, massgefertigte Sommerstücke in ruhigen Farben - gemacht für warme Tage, Reisen und entspannte Smart-Casual-Looks.","en":"Lightweight made-to-measure summer pieces in quiet colors - made for warm days, travel, and relaxed smart-casual dressing.","fr":"Des pièces d’été légères et sur mesure dans des couleurs sobres - pensées pour les journées chaudes, les voyages et les tenues smart casual détendues.","it":"Capi estivi leggeri e su misura in colori sobri - pensati per giornate calde, viaggi e look smart casual rilassati."}', '2026-06-26T00:00:00Z', '2026-06-26T00:00:00Z');
INSERT OR IGNORE INTO collection_member (id, collection_id, base_model_id, position) VALUES ('com_riviera_shirt', 'col_riviera', 'bm_riviera_shirt', 0);
INSERT OR IGNORE INTO collection_member (id, collection_id, base_model_id, position) VALUES ('com_riviera_trouser', 'col_riviera', 'bm_riviera_trouser', 1);

-- Cross-sell: each Riviera piece suggests the other.
INSERT OR IGNORE INTO cross_sell_rule (id, source_type, source_key, suggested_model_id, position, created_at, updated_at)
VALUES ('xsell_riviera_shirt_trouser', 'model', 'riviera-camp-shirt', 'bm_riviera_trouser', 0, '2026-06-26T00:00:00Z', '2026-06-26T00:00:00Z');
INSERT OR IGNORE INTO cross_sell_rule (id, source_type, source_key, suggested_model_id, position, created_at, updated_at)
VALUES ('xsell_riviera_trouser_shirt', 'model', 'riviera-drawstring-trouser', 'bm_riviera_shirt', 0, '2026-06-26T00:00:00Z', '2026-06-26T00:00:00Z');
