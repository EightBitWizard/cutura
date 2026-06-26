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

-- Base model: Oxford Business Shirt (Business Essentials)
INSERT OR IGNORE INTO base_model (id, garment_type_id, handle, name_i18n, description_i18n, base_price_minor, lead_time_min_days, lead_time_max_days, status, created_at, updated_at)
VALUES ('bm_oxford', 'gt_shirt', 'oxford-business-shirt', '{"de":"Oxford Business Shirt","en":"Oxford Business Shirt","fr":"Chemise Business Oxford","it":"Camicia Business Oxford"}', '{"de":"Das Oxford Business Shirt ist ein klares, vielseitiges Hemd für Büro, Meetings und gepflegte Alltagslooks. Der klassische Kragen, die saubere Knopfleiste und die strukturierte Oberfläche sorgen für einen ruhigen, professionellen Eindruck. Nach deinen Massen gefertigt und in Weiss oder Hellblau erhältlich.","en":"The Oxford Business Shirt is a clean, versatile shirt for the office, meetings, and refined daily wear. Its classic collar, neat button front, and structured surface create a calm, professional impression. Made to your measurements and available in white or light blue.","fr":"La Chemise Business Oxford est une chemise nette et polyvalente pour le bureau, les réunions et les tenues quotidiennes soignées. Son col classique, sa patte de boutonnage épurée et sa surface structurée créent une impression sobre et professionnelle. Confectionnée selon vos mesures et disponible en blanc ou bleu clair.","it":"La Camicia Business Oxford è una camicia pulita e versatile per ufficio, riunioni e look quotidiani curati. Il collo classico, l’abbottonatura ordinata e la superficie strutturata creano un’impressione sobria e professionale. Realizzata sulle tue misure e disponibile in bianco o azzurro."}', 12900, 21, 35, 'orderable', '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');

-- Fabrics
INSERT OR IGNORE INTO fabric (id, code, name_i18n, description_i18n, surcharge_minor, available, created_at, updated_at)
VALUES ('fab_white', 'OXF-WHT-01', '{"de":"Oxford Weiss","en":"Oxford White","fr":"Oxford blanc","it":"Oxford bianco"}', '{"de":"Ein klassischer weisser Hemdenstoff mit sauberer, strukturierter Oberfläche. Klar, vielseitig und ideal für Business-Hemden.","en":"A classic white shirting fabric with a clean, structured surface. Crisp, versatile, and ideal for business shirts.","fr":"Un tissu de chemise blanc classique à la surface nette et structurée. Clair, polyvalent et idéal pour les chemises business.","it":"Un classico tessuto bianco da camicia con superficie pulita e strutturata. Nitido, versatile e ideale per camicie business."}', 0, 1, '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');
INSERT OR IGNORE INTO fabric (id, code, name_i18n, description_i18n, surcharge_minor, available, created_at, updated_at)
VALUES ('fab_blue', 'OXF-BLU-01', '{"de":"Oxford Blau","en":"Oxford Blue","fr":"Oxford bleu","it":"Oxford blu"}', '{"de":"Ein hellblauer Hemdenstoff mit ruhiger, gepflegter Wirkung. Klassisch, sauber und gut kombinierbar im Business-Alltag.","en":"A light blue shirting fabric with a calm, polished character. Classic, clean, and easy to combine in everyday business wear.","fr":"Un tissu de chemise bleu clair à l’allure sobre et soignée. Classique, net et facile à associer au quotidien professionnel.","it":"Un tessuto azzurro da camicia dall’aspetto sobrio e curato. Classico, pulito e facile da abbinare nel quotidiano business."}', 2000, 1, '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');

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

-- Base model: City Pleated Trouser (Business Essentials)
INSERT OR IGNORE INTO base_model (id, garment_type_id, handle, name_i18n, description_i18n, base_price_minor, lead_time_min_days, lead_time_max_days, status, created_at, updated_at)
VALUES ('bm_chino', 'gt_trouser', 'city-pleated-trouser', '{"de":"City Pleated Trouser","en":"City Pleated Trouser","fr":"Pantalon City à pinces","it":"Pantalone City con pinces"}', '{"de":"Die City Pleated Trouser ist eine gepflegte Hose für Büro, Meetings und Smart-Casual-Looks. Die Bundfalten geben dem Vorderteil mehr Tiefe und Bewegungsfreiheit, während das gerade Bein für eine ruhige, klare Silhouette sorgt. Nach deinen Massen gefertigt und in Sand oder Marine erhältlich.","en":"The City Pleated Trouser is a refined trouser for the office, meetings, and smart-casual dressing. The front pleats add depth and ease of movement, while the straight leg creates a calm, clean silhouette. Made to your measurements and available in sand or navy.","fr":"Le Pantalon City à pinces est un pantalon soigné pour le bureau, les réunions et les tenues smart casual. Les pinces à l’avant apportent du volume et de l’aisance, tandis que la jambe droite crée une silhouette sobre et nette. Confectionné selon vos mesures et disponible en sable ou marine.","it":"Il Pantalone City con pinces è un pantalone curato per ufficio, riunioni e look smart casual. Le pinces frontali aggiungono profondità e libertà di movimento, mentre la gamba dritta crea una silhouette sobria e pulita. Realizzato sulle tue misure e disponibile in sabbia o blu navy."}', 14900, 21, 35, 'orderable', '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');

-- Trouser fabrics (with fibre composition + care, carried to the PDP + the sewn-in label)
INSERT OR IGNORE INTO fabric (id, code, name_i18n, description_i18n, care_data, surcharge_minor, available, created_at, updated_at)
VALUES ('fab_chino_navy', 'CHN-NAV-01', '{"de":"Chino Marine","en":"Chino Navy","fr":"Chino marine","it":"Chino blu navy"}', '{"de":"Ein dunkler Marine-Ton für klare, gepflegte Hosen. Wirkt formeller als helle Farben und bleibt trotzdem vielseitig.","en":"A dark navy tone for clean, refined trousers. More formal than lighter colors while remaining versatile.","fr":"Une teinte bleu marine foncé pour des pantalons nets et soignés. Plus formelle que les couleurs claires, tout en restant polyvalente.","it":"Una tonalità blu navy scura per pantaloni puliti e curati. Più formale dei colori chiari, ma comunque versatile."}', '["30C","no bleach","iron medium"]', 0, 1, '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');
INSERT OR IGNORE INTO fabric (id, code, name_i18n, description_i18n, care_data, surcharge_minor, available, created_at, updated_at)
VALUES ('fab_chino_stone', 'CHN-SND-01', '{"de":"Chino Sand","en":"Chino Sand","fr":"Chino sable","it":"Chino sabbia"}', '{"de":"Ein heller, neutraler Chino-Stoff für gepflegte Hosen. Ruhig, vielseitig und ideal für Business- und Smart-Casual-Kombinationen.","en":"A light neutral chino fabric for refined trousers. Quiet, versatile, and ideal for business and smart-casual combinations.","fr":"Un tissu chino clair et neutre pour pantalons soignés. Sobre, polyvalent et idéal pour les tenues business et smart casual.","it":"Un tessuto chino chiaro e neutro per pantaloni curati. Sobrio, versatile e ideale per abbinamenti business e smart casual."}', '["30C","no bleach","iron medium"]', 1500, 1, '2026-06-24T00:00:00Z', '2026-06-24T00:00:00Z');

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

-- Curated cross-sell rules live in the Essentials section at the end of this file (FR-1110).

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

-- ---------------------------------------------------------------------------
-- Casual Essentials catalog (2026-06-26): casual fabrics + the camp-collar shirt,
-- drawstring trouser, and linen essential shirt; plus the Business + Casual
-- Essentials collections (featured on the landing page) and reciprocal cross-sell.
-- Internal ids keep their original slugs (never shown); nothing user-facing says
-- "Riviera". Placeholder prices; em dashes normalized to hyphens (house rule).
-- ---------------------------------------------------------------------------

-- Casual fabrics: three colours (composition unknown) + white linen.
INSERT OR IGNORE INTO fabric (id, code, name_i18n, description_i18n, surcharge_minor, available, created_at, updated_at)
VALUES ('fab_riv_tobacco', 'CAS-TOB-01', '{"de":"Tabakbraun","en":"Tobacco Brown","fr":"Brun tabac","it":"Marrone tabacco"}', '{"de":"Ein warmer, ruhiger Braunton mit natürlicher Stoffstruktur. Geeignet für entspannte Hemden und Hosen der Casual Essentials Collection.","en":"A warm, quiet brown tone with a natural fabric texture. Suitable for relaxed shirts and trousers in the Casual Essentials collection.","fr":"Une teinte brune chaude et sobre à la texture naturelle. Adaptée aux chemises et pantalons décontractés de la collection Essentiels Casual.","it":"Una tonalità marrone calda e sobria con texture naturale. Adatta a camicie e pantaloni rilassati della collezione Essenziali Casual."}', 0, 1, '2026-06-26T00:00:00Z', '2026-06-26T00:00:00Z');
INSERT OR IGNORE INTO fabric (id, code, name_i18n, description_i18n, surcharge_minor, available, created_at, updated_at)
VALUES ('fab_riv_olive', 'CAS-OLV-01', '{"de":"Olivgrün","en":"Olive Green","fr":"Vert olive","it":"Verde oliva"}', '{"de":"Ein gedämpfter Olivton mit natürlicher Struktur. Ruhig, vielseitig und gut kombinierbar.","en":"A muted olive tone with a natural texture. Quiet, versatile, and easy to combine.","fr":"Une teinte olive sourde à la texture naturelle. Sobre, polyvalente et facile à associer.","it":"Una tonalità verde oliva attenuata con texture naturale. Sobria, versatile e facile da abbinare."}', 0, 1, '2026-06-26T00:00:00Z', '2026-06-26T00:00:00Z');
INSERT OR IGNORE INTO fabric (id, code, name_i18n, description_i18n, surcharge_minor, available, created_at, updated_at)
VALUES ('fab_riv_sand', 'CAS-SND-01', '{"de":"Sandbeige","en":"Sand Beige","fr":"Beige sable","it":"Beige sabbia"}', '{"de":"Ein heller, neutraler Sandton mit leichter, natürlicher Wirkung. Ideal für warme Tage und ruhige Kombinationen.","en":"A light neutral sand tone with an easy natural character. Ideal for warm days and calm combinations.","fr":"Une teinte sable claire et neutre au caractère naturel. Idéale pour les journées chaudes et les associations sobres.","it":"Una tonalità sabbia chiara e neutra dal carattere naturale. Ideale per giornate calde e abbinamenti sobri."}', 0, 1, '2026-06-26T00:00:00Z', '2026-06-26T00:00:00Z');
INSERT OR IGNORE INTO fabric (id, code, name_i18n, description_i18n, material, fibre_composition, surcharge_minor, available, created_at, updated_at)
VALUES ('fab_lin_white', 'LIN-WHT-01', '{"de":"Leinen Weiss","en":"White Linen","fr":"Lin blanc","it":"Lino bianco"}', '{"de":"Weisses Leinen mit natürlicher Struktur, leichtem Griff und sommerlichem Charakter.","en":"White linen with a natural texture, lightweight feel, and summer-ready character.","fr":"Lin blanc à la texture naturelle, au toucher léger et au caractère estival.","it":"Lino bianco con texture naturale, mano leggera e carattere estivo."}', 'Linen', '{"linen":100}', 0, 1, '2026-06-26T00:00:00Z', '2026-06-26T00:00:00Z');

-- Casual base models (orderable; placeholder prices; lead time 21/35).
INSERT OR IGNORE INTO base_model (id, garment_type_id, handle, name_i18n, description_i18n, base_price_minor, lead_time_min_days, lead_time_max_days, status, created_at, updated_at)
VALUES ('bm_riviera_shirt', 'gt_shirt', 'camp-collar-shirt', '{"de":"Camp Collar Shirt","en":"Camp Collar Shirt","fr":"Chemise à col camp","it":"Camicia con collo camp"}', '{"de":"Das Camp Collar Shirt ist ein leichtes, kurzärmeliges Hemd für warme Tage und entspannte Smart-Casual-Looks. Der offene Kragen, die klare Knopfleiste und die lockere Silhouette machen es vielseitig tragbar - solo, über einem T-Shirt oder kombiniert mit der passenden Drawstring Trouser. Nach deinen Massen gefertigt und in drei ruhigen Farben erhältlich.","en":"The Camp Collar Shirt is a lightweight short-sleeve shirt for warm days and relaxed smart-casual dressing. Its open collar, clean button front, and easy silhouette make it versatile - worn on its own, over a T-shirt, or paired with the matching Drawstring Trouser. Made to your measurements and available in three quiet colors.","fr":"La Chemise à col camp est une chemise légère à manches courtes pensée pour les journées chaudes et les tenues smart casual détendues. Son col ouvert, sa patte de boutonnage épurée et sa silhouette souple la rendent polyvalente - portée seule, sur un T-shirt ou avec le Pantalon à cordon assorti. Confectionnée selon vos mesures et disponible en trois couleurs sobres.","it":"La Camicia con collo camp è una camicia leggera a maniche corte pensata per giornate calde e look smart casual rilassati. Il collo aperto, l’abbottonatura pulita e la linea morbida la rendono versatile - da sola, sopra una T-shirt o abbinata al Pantalone con coulisse coordinato. Realizzata sulle tue misure e disponibile in tre colori sobri."}', 12900, 21, 35, 'orderable', '2026-06-26T00:00:00Z', '2026-06-26T00:00:00Z');
INSERT OR IGNORE INTO base_model (id, garment_type_id, handle, name_i18n, description_i18n, base_price_minor, lead_time_min_days, lead_time_max_days, status, created_at, updated_at)
VALUES ('bm_riviera_trouser', 'gt_trouser', 'drawstring-trouser', '{"de":"Drawstring Trouser","en":"Drawstring Trouser","fr":"Pantalon à cordon","it":"Pantalone con coulisse"}', '{"de":"Die Drawstring Trouser verbindet den Komfort einer lockeren Freizeithose mit der sauberen Linie einer massgefertigten Hose. Der elastische Bund mit Kordelzug sorgt für Bewegungsfreiheit, während das gerade Bein ruhig und gepflegt wirkt. Ideal für warme Tage, Reisen und entspannte Smart-Casual-Looks - allein getragen oder kombiniert mit dem passenden Camp Collar Shirt.","en":"The Drawstring Trouser combines the comfort of a relaxed casual pant with the clean look of a made-to-measure trouser. The elastic waistband and drawstring offer easy movement, while the straight leg keeps the silhouette refined and understated. Designed for warm days, travel, and relaxed smart-casual dressing - worn on its own or paired with the matching Camp Collar Shirt.","fr":"Le Pantalon à cordon associe le confort d’un pantalon décontracté à la ligne soignée d’un vêtement sur mesure. La taille élastique avec cordon offre une grande liberté de mouvement, tandis que la jambe droite conserve une silhouette élégante et discrète. Pensé pour les journées chaudes, les voyages et les tenues smart casual détendues - seul ou avec la Chemise à col camp assortie.","it":"Il Pantalone con coulisse unisce il comfort di un pantalone rilassato alla linea pulita di un capo su misura. La vita elasticizzata con coulisse offre libertà di movimento, mentre la gamba dritta mantiene una silhouette curata e discreta. Pensato per giornate calde, viaggi e look smart casual rilassati - da solo o abbinato alla Camicia con collo camp coordinata."}', 14900, 21, 35, 'orderable', '2026-06-26T00:00:00Z', '2026-06-26T00:00:00Z');
INSERT OR IGNORE INTO base_model (id, garment_type_id, handle, name_i18n, description_i18n, base_price_minor, lead_time_min_days, lead_time_max_days, status, created_at, updated_at)
VALUES ('bm_linen_shirt', 'gt_shirt', 'linen-essential-shirt', '{"de":"Linen Essential Shirt","en":"Linen Essential Shirt","fr":"Chemise Essential en lin","it":"Camicia Essential in lino"}', '{"de":"Das Linen Essential Shirt ist ein klassisches Leinenhemd für warme Tage und ruhige, gepflegte Looks. Der leichte Stoff, die natürliche Struktur und die klare Silhouette machen es vielseitig tragbar: offen über einem T-Shirt, sauber kombiniert mit Chino oder entspannt zu einer Sommerhose. Nach deinen Massen gefertigt und bewusst schlicht gehalten.","en":"The Linen Essential Shirt is a classic linen shirt designed for warm days and understated dressing. Its lightweight fabric, natural texture, and clean silhouette make it easy to wear open over a T-shirt, paired with chinos, or styled casually with relaxed summer trousers. Made to your measurements and kept deliberately simple.","fr":"La Chemise Essential en lin est une chemise classique pensée pour les journées chaudes et les tenues sobres. Son tissu léger, sa texture naturelle et sa silhouette épurée la rendent facile à porter ouverte sur un T-shirt, avec un chino ou avec un pantalon d’été plus détendu. Confectionnée selon vos mesures et volontairement simple.","it":"La Camicia Essential in lino è una camicia classica pensata per le giornate calde e per uno stile sobrio. Il tessuto leggero, la texture naturale e la linea pulita la rendono facile da indossare aperta sopra una T-shirt, con un chino o con pantaloni estivi rilassati. Realizzata sulle tue misure e volutamente essenziale."}', 12900, 21, 35, 'orderable', '2026-06-26T00:00:00Z', '2026-06-26T00:00:00Z');

-- Allowed fabrics: camp + drawstring allow the three casual colours; linen shirt allows white linen.
INSERT OR IGNORE INTO model_allowed_fabric (id, base_model_id, fabric_id, position) VALUES ('maf_riv_shirt_tob', 'bm_riviera_shirt', 'fab_riv_tobacco', 0);
INSERT OR IGNORE INTO model_allowed_fabric (id, base_model_id, fabric_id, position) VALUES ('maf_riv_shirt_olv', 'bm_riviera_shirt', 'fab_riv_olive', 1);
INSERT OR IGNORE INTO model_allowed_fabric (id, base_model_id, fabric_id, position) VALUES ('maf_riv_shirt_snd', 'bm_riviera_shirt', 'fab_riv_sand', 2);
INSERT OR IGNORE INTO model_allowed_fabric (id, base_model_id, fabric_id, position) VALUES ('maf_riv_trs_tob', 'bm_riviera_trouser', 'fab_riv_tobacco', 0);
INSERT OR IGNORE INTO model_allowed_fabric (id, base_model_id, fabric_id, position) VALUES ('maf_riv_trs_olv', 'bm_riviera_trouser', 'fab_riv_olive', 1);
INSERT OR IGNORE INTO model_allowed_fabric (id, base_model_id, fabric_id, position) VALUES ('maf_riv_trs_snd', 'bm_riviera_trouser', 'fab_riv_sand', 2);
INSERT OR IGNORE INTO model_allowed_fabric (id, base_model_id, fabric_id, position) VALUES ('maf_lin_shirt_white', 'bm_linen_shirt', 'fab_lin_white', 0);

-- Collections: Business + Casual Essentials, both featured on the landing page.
INSERT OR IGNORE INTO collection (id, handle, name_i18n, description_i18n, featured_on_landing, landing_position, created_at, updated_at)
VALUES ('col_business_essentials', 'business-essentials', '{"de":"Business Essentials","en":"Business Essentials","fr":"Essentiels Business","it":"Essenziali Business"}', '{"de":"Business Essentials steht für ruhige, präzise Garderobe mit klarer Linie. Die Kollektion umfasst massgefertigte Hemden und Hosen, die sauber wirken, ohne steif zu sein - gemacht für Büro, Meetings und einen gepflegten Alltag.","en":"Business Essentials is built around calm, precise wardrobe staples with a clean silhouette. The collection includes made-to-measure shirts and trousers that look refined without feeling stiff - made for the office, meetings, and polished daily wear.","fr":"Essentiels Business repose sur une garde-robe sobre, précise et aux lignes nettes. La collection comprend des chemises et pantalons sur mesure, élégants sans être rigides - pensés pour le bureau, les réunions et un quotidien soigné.","it":"Essenziali Business nasce da un guardaroba sobrio, preciso e dalle linee pulite. La collezione comprende camicie e pantaloni su misura, curati senza risultare rigidi - pensati per ufficio, riunioni e quotidianità elegante."}', 1, 1, '2026-06-26T00:00:00Z', '2026-06-26T00:00:00Z');
INSERT OR IGNORE INTO collection (id, handle, name_i18n, description_i18n, featured_on_landing, landing_position, created_at, updated_at)
VALUES ('col_casual_essentials', 'casual-essentials', '{"de":"Casual Essentials","en":"Casual Essentials","fr":"Essentiels Casual","it":"Essenziali Casual"}', '{"de":"Casual Essentials verbindet leichte Stoffe, ruhige Farben und entspannte Silhouetten mit der Präzision von Massanfertigung. Die Kollektion ist für warme Tage, Reisen und gepflegte Freizeit-Looks gedacht - schlicht, vielseitig und nach deinen Massen gefertigt.","en":"Casual Essentials combines lightweight fabrics, quiet colors, and relaxed silhouettes with the precision of made-to-measure. The collection is designed for warm days, travel, and refined off-duty dressing - simple, versatile, and made to your measurements.","fr":"Essentiels Casual associe des tissus légers, des couleurs sobres et des silhouettes détendues à la précision du sur mesure. La collection est pensée pour les journées chaudes, les voyages et les tenues décontractées soignées - simple, polyvalente et confectionnée selon vos mesures.","it":"Essenziali Casual unisce tessuti leggeri, colori sobri e silhouette rilassate alla precisione del su misura. La collezione è pensata per giornate calde, viaggi e look informali curati - semplice, versatile e realizzata sulle tue misure."}', 1, 2, '2026-06-26T00:00:00Z', '2026-06-26T00:00:00Z');
INSERT OR IGNORE INTO collection_member (id, collection_id, base_model_id, position) VALUES ('com_business_oxford', 'col_business_essentials', 'bm_oxford', 0);
INSERT OR IGNORE INTO collection_member (id, collection_id, base_model_id, position) VALUES ('com_business_city', 'col_business_essentials', 'bm_chino', 1);
INSERT OR IGNORE INTO collection_member (id, collection_id, base_model_id, position) VALUES ('com_casual_camp', 'col_casual_essentials', 'bm_riviera_shirt', 0);
INSERT OR IGNORE INTO collection_member (id, collection_id, base_model_id, position) VALUES ('com_casual_draw', 'col_casual_essentials', 'bm_riviera_trouser', 1);
INSERT OR IGNORE INTO collection_member (id, collection_id, base_model_id, position) VALUES ('com_casual_linen', 'col_casual_essentials', 'bm_linen_shirt', 2);

-- Cross-sell: reciprocal within each collection (source_key = handle, suggested = model id).
INSERT OR IGNORE INTO cross_sell_rule (id, source_type, source_key, suggested_model_id, position, created_at, updated_at) VALUES ('xs_camp_draw', 'model', 'camp-collar-shirt', 'bm_riviera_trouser', 0, '2026-06-26T00:00:00Z', '2026-06-26T00:00:00Z');
INSERT OR IGNORE INTO cross_sell_rule (id, source_type, source_key, suggested_model_id, position, created_at, updated_at) VALUES ('xs_draw_camp', 'model', 'drawstring-trouser', 'bm_riviera_shirt', 0, '2026-06-26T00:00:00Z', '2026-06-26T00:00:00Z');
INSERT OR IGNORE INTO cross_sell_rule (id, source_type, source_key, suggested_model_id, position, created_at, updated_at) VALUES ('xs_linen_draw', 'model', 'linen-essential-shirt', 'bm_riviera_trouser', 0, '2026-06-26T00:00:00Z', '2026-06-26T00:00:00Z');
INSERT OR IGNORE INTO cross_sell_rule (id, source_type, source_key, suggested_model_id, position, created_at, updated_at) VALUES ('xs_linen_camp', 'model', 'linen-essential-shirt', 'bm_riviera_shirt', 1, '2026-06-26T00:00:00Z', '2026-06-26T00:00:00Z');
INSERT OR IGNORE INTO cross_sell_rule (id, source_type, source_key, suggested_model_id, position, created_at, updated_at) VALUES ('xs_oxford_city', 'model', 'oxford-business-shirt', 'bm_chino', 0, '2026-06-26T00:00:00Z', '2026-06-26T00:00:00Z');
INSERT OR IGNORE INTO cross_sell_rule (id, source_type, source_key, suggested_model_id, position, created_at, updated_at) VALUES ('xs_city_oxford', 'model', 'city-pleated-trouser', 'bm_oxford', 0, '2026-06-26T00:00:00Z', '2026-06-26T00:00:00Z');
