import { z } from 'zod'

// Schema para transação individual
export const TransactionSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  descricao_original: z.string().min(1),
  estabelecimento: z.string().min(1),
  cnpj: z.string().optional(),
  tipo: z.enum(['credito', 'debito']),
  valor: z.number(),
  categoria: z.string().min(1),
  subcategoria: z.string().optional(),
  meio_pagamento: z.string().optional(),
  banco_origem: z.string().optional(),
  banco_destino: z.string().optional(),
  observacoes: z.string().optional(),
  confianca_classificacao: z.number().min(0).max(1).optional(),
  id_transacao: z.string().optional()
})

// Schema para ingest de statement
export const IngestSchema = z.object({
  userId: z.number().int().positive(),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sourceFile: z.string().min(1),
  transacoes: z.array(TransactionSchema).min(1)
})

// Schema para query de transações
export const TransactionsQuerySchema = z.object({
  userId: z.number().int().positive().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  category: z.string().optional().transform(val => val ? val.split(',') : undefined),
  subcategory: z.string().optional().transform(val => val ? val.split(',') : undefined),
  type: z.string().optional().transform(val => val ? val.split(',') : undefined),
  paymentMethod: z.string().optional().transform(val => val ? val.split(',') : undefined),
  q: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  pageSize: z.string().optional().transform(val => val ? parseInt(val) : 50),
  sort: z.string().optional()
})

// Schema para query de dashboard
export const DashQuerySchema = z.object({
  userId: z.number().int().positive().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  groupBy: z.enum(['day', 'week', 'month']).optional()
})

// Tipos inferidos
export type TransactionDTO = z.infer<typeof TransactionSchema>
export type IngestDTO = z.infer<typeof IngestSchema>
export type TransactionsQueryDTO = z.infer<typeof TransactionsQuerySchema>
export type DashQueryDTO = z.infer<typeof DashQuerySchema>
