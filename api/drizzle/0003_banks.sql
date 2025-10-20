-- Criar tabela banks (se não existir)
CREATE TABLE IF NOT EXISTS `banks` (
	`id` integer PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL
);

-- Criar índice único para code (se não existir)
CREATE UNIQUE INDEX IF NOT EXISTS `banks_code_unique` ON `banks` (`code`);

-- Adicionar coluna bank_id na tabela transactions (se não existir)
-- SQLite não suporta IF NOT EXISTS para ALTER TABLE, então vamos verificar primeiro
-- Esta migration assume que a coluna ainda não existe

-- Remover coluna banco_destino da tabela transactions (se existir)
-- SQLite não suporta DROP COLUMN diretamente, então vamos comentar por enquanto
-- ALTER TABLE transactions DROP COLUMN `banco_destino`;

-- Criar índice para performance (se não existir)
CREATE INDEX IF NOT EXISTS `idx_tx_bank_id` ON `transactions` (`bank_id`);

-- Nota: A validação de foreign key será feita no código (statements.service.ts)
