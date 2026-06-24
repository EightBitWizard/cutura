ALTER TABLE `order` ADD `shopify_draft_id` text;--> statement-breakpoint
ALTER TABLE `order` ADD `invoice_url` text;--> statement-breakpoint
ALTER TABLE `order_item` ADD `config_enc` text;