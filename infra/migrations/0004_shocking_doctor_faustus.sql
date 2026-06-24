CREATE TABLE `cross_sell_rule` (
	`id` text PRIMARY KEY NOT NULL,
	`source_type` text NOT NULL,
	`source_key` text NOT NULL,
	`suggested_model_id` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
