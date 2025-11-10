-- Migration: Simplify transactions table and normalize field names
-- Remove unnecessary columns and rename fields to English

-- Remove columns from transactions table
ALTER TABLE transactions DROP COLUMN IF EXISTS id_transacao;
ALTER TABLE transactions DROP COLUMN IF EXISTS confianca_classificacao;
ALTER TABLE transactions DROP COLUMN IF EXISTS cnpj;
ALTER TABLE transactions DROP COLUMN IF EXISTS is_refund_or_chargeback;
ALTER TABLE transactions DROP COLUMN IF EXISTS observacoes;

-- Rename columns in transactions table
ALTER TABLE transactions RENAME COLUMN statement_id TO statement_id_new;
ALTER TABLE transactions ADD COLUMN statement_id integer REFERENCES statements(id);
UPDATE transactions SET statement_id = statement_id_new;
ALTER TABLE transactions DROP COLUMN statement_id_new;

ALTER TABLE transactions RENAME COLUMN data TO date;
ALTER TABLE transactions RENAME COLUMN descricao_original TO description;
ALTER TABLE transactions RENAME COLUMN estabelecimento TO merchant;
ALTER TABLE transactions RENAME COLUMN tipo TO type;
ALTER TABLE transactions RENAME COLUMN valor TO amount;
ALTER TABLE transactions RENAME COLUMN categoria TO category;
ALTER TABLE transactions RENAME COLUMN subcategoria TO subcategory;
ALTER TABLE transactions RENAME COLUMN category_id TO category_id_new;
ALTER TABLE transactions ADD COLUMN category_id integer REFERENCES categories(id);
UPDATE transactions SET category_id = category_id_new;
ALTER TABLE transactions DROP COLUMN category_id_new;

ALTER TABLE transactions RENAME COLUMN subcategory_id TO subcategory_id_new;
ALTER TABLE transactions ADD COLUMN subcategory_id integer REFERENCES categories(id);
UPDATE transactions SET subcategory_id = subcategory_id_new;
ALTER TABLE transactions DROP COLUMN subcategory_id_new;

ALTER TABLE transactions RENAME COLUMN is_internal_transfer TO is_internal_transfer_new;
ALTER TABLE transactions ADD COLUMN is_internal_transfer integer NOT NULL DEFAULT 0;
UPDATE transactions SET is_internal_transfer = is_internal_transfer_new;
ALTER TABLE transactions DROP COLUMN is_internal_transfer_new;

ALTER TABLE transactions RENAME COLUMN is_card_bill_payment TO is_card_bill_payment_new;
ALTER TABLE transactions ADD COLUMN is_card_bill_payment integer NOT NULL DEFAULT 0;
UPDATE transactions SET is_card_bill_payment = is_card_bill_payment_new;
ALTER TABLE transactions DROP COLUMN is_card_bill_payment_new;

ALTER TABLE transactions RENAME COLUMN is_investment TO is_investment_new;
ALTER TABLE transactions ADD COLUMN is_investment integer NOT NULL DEFAULT 0;
UPDATE transactions SET is_investment = is_investment_new;
ALTER TABLE transactions DROP COLUMN is_investment_new;

ALTER TABLE transactions RENAME COLUMN payment_method_id TO payment_method_id_new;
ALTER TABLE transactions ADD COLUMN payment_method_id integer REFERENCES payment_methods(id);
UPDATE transactions SET payment_method_id = payment_method_id_new;
ALTER TABLE transactions DROP COLUMN payment_method_id_new;

ALTER TABLE transactions RENAME COLUMN meio_pagamento TO payment_method;
ALTER TABLE transactions RENAME COLUMN bank_id TO bank_id_new;
ALTER TABLE transactions ADD COLUMN bank_id integer REFERENCES banks(id);
UPDATE transactions SET bank_id = bank_id_new;
ALTER TABLE transactions DROP COLUMN bank_id_new;

ALTER TABLE transactions RENAME COLUMN banco_origem TO bank_name;
ALTER TABLE transactions RENAME COLUMN created_at TO created_at_new;
ALTER TABLE transactions ADD COLUMN created_at timestamp NOT NULL DEFAULT NOW();
UPDATE transactions SET created_at = created_at_new;
ALTER TABLE transactions DROP COLUMN created_at_new;

-- Rename columns in statements table
ALTER TABLE statements RENAME COLUMN user_id TO user_id_new;
ALTER TABLE statements ADD COLUMN user_id integer NOT NULL REFERENCES users(id);
UPDATE statements SET user_id = user_id_new;
ALTER TABLE statements DROP COLUMN user_id_new;

ALTER TABLE statements RENAME COLUMN period_start TO period_start_new;
ALTER TABLE statements ADD COLUMN period_start varchar NOT NULL;
UPDATE statements SET period_start = period_start_new;
ALTER TABLE statements DROP COLUMN period_start_new;

ALTER TABLE statements RENAME COLUMN period_end TO period_end_new;
ALTER TABLE statements ADD COLUMN period_end varchar NOT NULL;
UPDATE statements SET period_end = period_end_new;
ALTER TABLE statements DROP COLUMN period_end_new;

ALTER TABLE statements RENAME COLUMN source_file TO source_file_new;
ALTER TABLE statements ADD COLUMN source_file varchar NOT NULL;
UPDATE statements SET source_file = source_file_new;
ALTER TABLE statements DROP COLUMN source_file_new;

ALTER TABLE statements RENAME COLUMN created_at TO created_at_new;
ALTER TABLE statements ADD COLUMN created_at timestamp NOT NULL DEFAULT NOW();
UPDATE statements SET created_at = created_at_new;
ALTER TABLE statements DROP COLUMN created_at_new;

-- Rename columns in categories table
ALTER TABLE categories RENAME COLUMN parent_id TO parent_id_new;
ALTER TABLE categories ADD COLUMN parent_id integer REFERENCES categories(id);
UPDATE categories SET parent_id = parent_id_new;
ALTER TABLE categories DROP COLUMN parent_id_new;

-- Rename columns in users table
ALTER TABLE users RENAME COLUMN api_key TO api_key_new;
ALTER TABLE users ADD COLUMN api_key varchar;
UPDATE users SET api_key = api_key_new;
ALTER TABLE users DROP COLUMN api_key_new;

ALTER TABLE users RENAME COLUMN created_at TO created_at_new;
ALTER TABLE users ADD COLUMN created_at timestamp NOT NULL DEFAULT NOW();
UPDATE users SET created_at = created_at_new;
ALTER TABLE users DROP COLUMN created_at_new;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_statement_id ON transactions(statement_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method_id ON transactions(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_transactions_bank_id ON transactions(bank_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
