CREATE TABLE `producer_catalog_map` (
	`id` text PRIMARY KEY NOT NULL,
	`producer` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_key` text NOT NULL,
	`external_code` text NOT NULL,
	`extra` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `producer_catalog_map_unique` ON `producer_catalog_map` (`producer`,`entity_type`,`entity_key`);