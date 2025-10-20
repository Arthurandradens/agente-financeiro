CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`parent_id` integer,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`kind` text DEFAULT 'spend' NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE transactions ADD `category_id` integer;
--> statement-breakpoint
ALTER TABLE transactions ADD `subcategory_id` integer;
--> statement-breakpoint
ALTER TABLE transactions ADD `is_internal_transfer` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE transactions ADD `is_card_bill_payment` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE transactions ADD `is_investment` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE transactions ADD `is_refund_or_chargeback` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);
