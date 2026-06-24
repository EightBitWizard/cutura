CREATE TABLE `recommendation_signal` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text,
	`session_id` text NOT NULL,
	`signal_type` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`created_at` text NOT NULL
);
