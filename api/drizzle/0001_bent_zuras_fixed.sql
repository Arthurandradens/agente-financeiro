-- Criar tabela categories
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`parent_id` integer,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`kind` text DEFAULT 'spend' NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);

-- Adicionar colunas na tabela transactions (sem foreign keys por enquanto)
ALTER TABLE transactions ADD `category_id` integer;
ALTER TABLE transactions ADD `subcategory_id` integer;
ALTER TABLE transactions ADD `is_internal_transfer` integer DEFAULT 0 NOT NULL;
ALTER TABLE transactions ADD `is_card_bill_payment` integer DEFAULT 0 NOT NULL;
ALTER TABLE transactions ADD `is_investment` integer DEFAULT 0 NOT NULL;
ALTER TABLE transactions ADD `is_refund_or_chargeback` integer DEFAULT 0 NOT NULL;

-- Criar índice único para slug
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);

-- Nota: As foreign keys serão aplicadas via código, não via SQL direto
-- pois SQLite não suporta adicionar FKs em colunas existentes

