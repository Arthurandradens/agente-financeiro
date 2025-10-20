import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core'
import { statements } from './statements'
import { categories } from './categories'
import { paymentMethods } from './payment-methods'
import { banks } from './banks'

export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  statementId: integer('statement_id').notNull().references(() => statements.id),
  data: text('data').notNull(), // YYYY-MM-DD
  descricaoOriginal: text('descricao_original').notNull(),
  estabelecimento: text('estabelecimento').notNull(),
  cnpj: text('cnpj'),
  tipo: text('tipo', { enum: ['credito', 'debito'] }).notNull(),
  valor: real('valor').notNull(),
  categoria: text('categoria').notNull(), // DEPRECATED - manter para compatibilidade
  subcategoria: text('subcategoria'), // DEPRECATED - manter para compatibilidade
  categoryId: integer('category_id').references(() => categories.id),
  subcategoryId: integer('subcategory_id').references(() => categories.id),
  isInternalTransfer: integer('is_internal_transfer').notNull().default(0),
  isCardBillPayment: integer('is_card_bill_payment').notNull().default(0),
  isInvestment: integer('is_investment').notNull().default(0),
  isRefundOrChargeback: integer('is_refund_or_chargeback').notNull().default(0),
  paymentMethodId: integer('payment_method_id').references(() => paymentMethods.id),
  meioPagamento: text('meio_pagamento'), // DEPRECATED - será removido futuramente
  bankId: integer('bank_id').references(() => banks.id),
  bancoOrigem: text('banco_origem'), // DEPRECATED - manter para compatibilidade
  observacoes: text('observacoes'),
  confiancaClassificacao: real('confianca_classificacao'),
  idTransacao: text('id_transacao').notNull().unique(), // hashId único
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP')
})
