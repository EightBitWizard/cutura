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
