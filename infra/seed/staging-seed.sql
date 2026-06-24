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
