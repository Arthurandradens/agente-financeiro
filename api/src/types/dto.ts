import { z } from "zod";

// Schema para transação individual
export const TransactionSchema = z.object({
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  descricao_original: z.string().min(1),
  estabelecimento: z.string().min(1),
  cnpj: z.string().optional(),
  tipo: z.enum(["credito", "debito"]),
  valor: z.number(),
  categoria: z.string().min(1),
  subcategoria: z.string().optional(),
  meio_pagamento: z.string().optional(),
  bank_id: z.number().int().positive().optional(),
  observacoes: z.string().optional(),
  confianca_classificacao: z.number().min(0).max(1).optional(),
  id_transacao: z.string().optional(),
});

// Schema para ingest de statement
export const IngestSchema = z.object({
  userId: z.number().int().positive(),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sourceFile: z.string().min(1),
  transacoes: z.array(TransactionSchema).min(1),
});

// Schema para query de transações
export const TransactionsQuerySchema = z.object({
  userId: z.number().int().positive().optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),

  // Filtros por STRING (compatibilidade)
  category: z.string().optional(),
  subcategory: z.string().optional(),

  // Filtros por ID (NOVO - preferencial)
  categoryIds: z.string().optional(),
  subcategoryIds: z.string().optional(),
  paymentMethodIds: z.string().optional(),

  // Filtros existentes
  categoryId: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),
  subcategoryId: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),
  type: z.enum(["credito", "debito"]).optional(),
  paymentMethodId: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),
  paymentCode: z.string().optional(),
  q: z.string().optional(),
  includeTransfers: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  pageSize: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 20)),
  sort: z
    .enum([
      "data",
      "-data",
      "valor",
      "-valor",
      "categoria",
      "-categoria",
      "confianca_classificacao",
      "-confianca_classificacao",
    ])
    .optional(),
});

// Schema para query de dashboard
export const DashQuerySchema = z.object({
  userId: z.number().int().positive().optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  groupBy: z.enum(["day", "week", "month"]).optional(),

  // Filtros por string (compatibilidade)
  categories: z.string().optional(),
  subcategories: z.string().optional(),
  paymentMethods: z.string().optional(),

  // Filtros por ID (novo - preferencial)
  categoryIds: z.string().optional(),
  subcategoryIds: z.string().optional(),
  paymentMethodIds: z.string().optional(),

  q: z.string().optional(),
});

// Schema para query de overview
export const OverviewQuerySchema = z.object({
  userId: z.number().int().positive().optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),

  // Filtros por string (compatibilidade)
  categories: z.string().optional(),
  subcategories: z.string().optional(),
  paymentMethods: z.string().optional(),

  // Filtros por ID (novo - preferencial)
  categoryIds: z.string().optional(),
  subcategoryIds: z.string().optional(),
  paymentMethodIds: z.string().optional(),

  q: z.string().optional(),
});

// Schema para query de categorias
export const CategoryQuerySchema = z.object({
  userId: z.number().int().positive().optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),

  // Filtros por string (compatibilidade)
  categories: z.string().optional(),
  subcategories: z.string().optional(),
  paymentMethods: z.string().optional(),

  // Filtros por ID (novo - preferencial)
  categoryIds: z.string().optional(),
  subcategoryIds: z.string().optional(),
  paymentMethodIds: z.string().optional(),

  q: z.string().optional(),
});

// Schema para query de séries
export const SeriesQuerySchema = z.object({
  userId: z.number().int().positive().optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  groupBy: z.enum(["day", "week", "month"]).optional(),

  // Filtros por string (compatibilidade)
  categories: z.string().optional(),
  subcategories: z.string().optional(),
  paymentMethods: z.string().optional(),

  // Filtros por ID (novo - preferencial)
  categoryIds: z.string().optional(),
  subcategoryIds: z.string().optional(),
  paymentMethodIds: z.string().optional(),

  q: z.string().optional(),
});

// Schema para query de top subcategorias
export const TopSubcategoriesQuerySchema = z.object({
  userId: z.number().int().positive().optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),

  // Filtros por string (compatibilidade)
  categories: z.string().optional(),
  subcategories: z.string().optional(),
  paymentMethods: z.string().optional(),

  // Filtros por ID (novo - preferencial)
  categoryIds: z.string().optional(),
  subcategoryIds: z.string().optional(),
  paymentMethodIds: z.string().optional(),

  q: z.string().optional(),
});

// Tipos inferidos
export type TransactionDTO = z.infer<typeof TransactionSchema>;
export type IngestDTO = z.infer<typeof IngestSchema>;
export type TransactionsQueryDTO = z.infer<typeof TransactionsQuerySchema>;
export type DashQueryDTO = z.infer<typeof DashQuerySchema>;
export type OverviewQueryDTO = z.infer<typeof OverviewQuerySchema>;
export type CategoryQueryDTO = z.infer<typeof CategoryQuerySchema>;
export type SeriesQueryDTO = z.infer<typeof SeriesQuerySchema>;
export type TopSubcategoriesQueryDTO = z.infer<
  typeof TopSubcategoriesQuerySchema
>;
