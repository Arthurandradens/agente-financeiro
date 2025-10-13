import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core'
import { statements } from './statements.js'

export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  statementId: integer('statement_id').notNull().references(() => statements.id),
  data: text('data').notNull(), // YYYY-MM-DD
  descricaoOriginal: text('descricao_original').notNull(),
  estabelecimento: text('estabelecimento').notNull(),
  cnpj: text('cnpj'),
  tipo: text('tipo', { enum: ['credito', 'debito'] }).notNull(),
  valor: real('valor').notNull(),
  categoria: text('categoria').notNull(),
  subcategoria: text('subcategoria'),
  meioPagamento: text('meio_pagamento'),
  bancoOrigem: text('banco_origem'),
  bancoDestino: text('banco_destino'),
  observacoes: text('observacoes'),
  confiancaClassificacao: real('confianca_classificacao'),
  idTransacao: text('id_transacao').notNull().unique(), // hashId único
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP')
})
