CREATE TABLE `attribute_definition` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`label_i18n` text NOT NULL,
	`applies_to` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attribute_definition_key_unique` ON `attribute_definition` (`key`);--> statement-breakpoint
CREATE TABLE `attribute_value` (
	`id` text PRIMARY KEY NOT NULL,
	`attribute_definition_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attribute_value_unique` ON `attribute_value` (`attribute_definition_id`,`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `base_model` (
	`id` text PRIMARY KEY NOT NULL,
	`garment_type_id` text NOT NULL,
	`handle` text NOT NULL,
	`name_i18n` text NOT NULL,
	`description_i18n` text,
	`base_price_minor` integer NOT NULL,
	`lead_time_min_days` integer NOT NULL,
	`lead_time_max_days` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`attributes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `base_model_handle_unique` ON `base_model` (`handle`);--> statement-breakpoint
CREATE TABLE `collection` (
	`id` text PRIMARY KEY NOT NULL,
	`handle` text NOT NULL,
	`name_i18n` text NOT NULL,
	`description_i18n` text,
	`banner_media_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collection_handle_unique` ON `collection` (`handle`);--> statement-breakpoint
CREATE TABLE `collection_member` (
	`id` text PRIMARY KEY NOT NULL,
	`collection_id` text NOT NULL,
	`base_model_id` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collection_member_unique` ON `collection_member` (`collection_id`,`base_model_id`);--> statement-breakpoint
CREATE TABLE `content_page` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`kind` text NOT NULL,
	`title_i18n` text NOT NULL,
	`body_i18n` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_page_slug_unique` ON `content_page` (`slug`);--> statement-breakpoint
CREATE TABLE `fabric` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name_i18n` text NOT NULL,
	`description_i18n` text,
	`material` text,
	`fibre_composition` text,
	`care_data` text,
	`color_family` text,
	`weight_gsm` integer,
	`surcharge_minor` integer DEFAULT 0 NOT NULL,
	`available` integer DEFAULT true NOT NULL,
	`supplier_id` text,
	`attributes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fabric_code_unique` ON `fabric` (`code`);--> statement-breakpoint
CREATE TABLE `garment_type` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`name_i18n` text NOT NULL,
	`measurement_schema_id` text,
	`supplier_spec_template_id` text,
	`qc_template_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `garment_type_key_unique` ON `garment_type` (`key`);--> statement-breakpoint
CREATE TABLE `measurement_schema` (
	`id` text PRIMARY KEY NOT NULL,
	`garment_type_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`fields` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`r2_key` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`alt` text,
	`kind` text,
	`position` integer DEFAULT 0 NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `model_allowed_fabric` (
	`id` text PRIMARY KEY NOT NULL,
	`base_model_id` text NOT NULL,
	`fabric_id` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `model_allowed_fabric_unique` ON `model_allowed_fabric` (`base_model_id`,`fabric_id`);--> statement-breakpoint
CREATE TABLE `model_allowed_option` (
	`id` text PRIMARY KEY NOT NULL,
	`base_model_id` text NOT NULL,
	`option_group_id` text NOT NULL,
	`required` integer DEFAULT false NOT NULL,
	`position` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `model_allowed_option_unique` ON `model_allowed_option` (`base_model_id`,`option_group_id`);--> statement-breakpoint
CREATE TABLE `model_allowed_upgrade` (
	`id` text PRIMARY KEY NOT NULL,
	`base_model_id` text NOT NULL,
	`upgrade_id` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `model_allowed_upgrade_unique` ON `model_allowed_upgrade` (`base_model_id`,`upgrade_id`);--> statement-breakpoint
CREATE TABLE `option_group` (
	`id` text PRIMARY KEY NOT NULL,
	`garment_type_id` text NOT NULL,
	`code` text NOT NULL,
	`label_i18n` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `option_value` (
	`id` text PRIMARY KEY NOT NULL,
	`option_group_id` text NOT NULL,
	`code` text NOT NULL,
	`label_i18n` text NOT NULL,
	`description_i18n` text,
	`surcharge_minor` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `publication` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`environment` text NOT NULL,
	`published_at` text NOT NULL,
	`published_by` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `publication_unique` ON `publication` (`entity_type`,`entity_id`,`environment`);--> statement-breakpoint
CREATE TABLE `qc_template` (
	`id` text PRIMARY KEY NOT NULL,
	`garment_type_id` text NOT NULL,
	`items` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `supplier_spec_template` (
	`id` text PRIMARY KEY NOT NULL,
	`garment_type_id` text NOT NULL,
	`structure` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `upgrade` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name_i18n` text NOT NULL,
	`description_i18n` text,
	`price_minor` integer NOT NULL,
	`placement` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `upgrade_code_unique` ON `upgrade` (`code`);--> statement-breakpoint
CREATE TABLE `config` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `feature_flag` (
	`key` text PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`value` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `address` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`line1` text NOT NULL,
	`line2` text,
	`city` text NOT NULL,
	`zip` text NOT NULL,
	`country` text NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`detail` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `communication_log` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text,
	`channel` text DEFAULT 'email' NOT NULL,
	`template` text NOT NULL,
	`to_address` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `customer` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`locale` text DEFAULT 'de' NOT NULL,
	`marketing_consent` integer DEFAULT false NOT NULL,
	`deletion_state` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customer_email_unique` ON `customer` (`email`);--> statement-breakpoint
CREATE TABLE `fit_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`overall_rating` integer,
	`fit_by_region` text,
	`notes` text,
	`wants_remake` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fit_review` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`order_item_id` text,
	`reason` text NOT NULL,
	`photo_r2_keys` text,
	`status` text DEFAULT 'open' NOT NULL,
	`decision` text,
	`remake_order_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `measurement_profile` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text,
	`name` text,
	`current_version` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `measurement_version` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`version` integer NOT NULL,
	`previous_version` integer,
	`garment_type` text NOT NULL,
	`method` text NOT NULL,
	`original_inputs_enc` text,
	`derived_values_enc` text,
	`confirmed_values_enc` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `measurement_version_unique` ON `measurement_version` (`profile_id`,`version`);--> statement-breakpoint
CREATE TABLE `notify_request` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`locale` text DEFAULT 'de' NOT NULL,
	`notified_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order` (
	`id` text PRIMARY KEY NOT NULL,
	`order_number` text NOT NULL,
	`customer_id` text,
	`guest_email` text,
	`guest_tracking_token` text,
	`locale` text DEFAULT 'de' NOT NULL,
	`currency` text DEFAULT 'CHF' NOT NULL,
	`total_minor` integer NOT NULL,
	`accepted_terms_version` text NOT NULL,
	`accepted_privacy_version` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`shopify_order_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `order_order_number_unique` ON `order` (`order_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `order_guest_tracking_token_unique` ON `order` (`guest_tracking_token`);--> statement-breakpoint
CREATE UNIQUE INDEX `order_shopify_order_id_unique` ON `order` (`shopify_order_id`);--> statement-breakpoint
CREATE TABLE `order_cost` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`fabric_minor` integer,
	`production_minor` integer,
	`inbound_minor` integer,
	`fees_minor` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `order_cost_order_id_unique` ON `order_cost` (`order_id`);--> statement-breakpoint
CREATE TABLE `order_item` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`base_model_id` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payment_event` (
	`event_id` text PRIMARY KEY NOT NULL,
	`order_id` text,
	`type` text NOT NULL,
	`payload` text,
	`processed_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `production_package` (
	`id` text PRIMARY KEY NOT NULL,
	`order_item_id` text NOT NULL,
	`garment_type` text NOT NULL,
	`supplier_id` text,
	`snapshot_enc` text NOT NULL,
	`internal_notes` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `production_package_order_item_id_unique` ON `production_package` (`order_item_id`);--> statement-breakpoint
CREATE TABLE `qc_record` (
	`id` text PRIMARY KEY NOT NULL,
	`production_package_id` text NOT NULL,
	`checklist` text NOT NULL,
	`overall_result` text NOT NULL,
	`notes` text,
	`photo_r2_keys` text,
	`reviewed_by` text,
	`reviewed_at` text,
	`override_reason` text,
	`override_by` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `qc_record_production_package_id_unique` ON `qc_record` (`production_package_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shipping_method` (
	`id` text PRIMARY KEY NOT NULL,
	`zone_id` text NOT NULL,
	`code` text NOT NULL,
	`price_minor` integer DEFAULT 0 NOT NULL,
	`kind` text DEFAULT 'standard' NOT NULL,
	`included_in_price` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shipping_zone` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`countries` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `status_event` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text,
	`order_item_id` text,
	`from_status` text,
	`to_status` text NOT NULL,
	`reason` text,
	`actor` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `supplier` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`contact` text,
	`capabilities` text,
	`notes` text,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
