-- Criar tabela payment_methods
CREATE TABLE `payment_methods` (
	`id` integer PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`label` text NOT NULL,
	`aliases` text
);

-- Criar índice único para code
CREATE UNIQUE INDEX `payment_methods_code_unique` ON `payment_methods` (`code`);

-- Adicionar coluna payment_method_id na tabela transactions
ALTER TABLE transactions ADD `payment_method_id` integer;

-- Criar índices para performance
CREATE INDEX `idx_tx_payment_method` ON `transactions` (`payment_method_id`);
CREATE INDEX `idx_tx_flags` ON `transactions` (`is_internal_transfer`, `is_card_bill_payment`, `is_investment`);
