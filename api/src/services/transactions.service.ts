import { eq, and, gte, lte, like, inArray, desc, asc } from 'drizzle-orm'
import { transactions } from '../schema/index.js'
import type { FastifyInstance } from 'fastify'

export interface TransactionFilters {
  userId?: number
  from?: string
  to?: string
  category?: string[]
  subcategory?: string[]
  type?: string[]
  paymentMethod?: string[]
  q?: string
  page?: number
  pageSize?: number
  sort?: string
}

export interface TransactionListResult {
  items: any[]
  page: number
  pageSize: number
  total: number
}

export class TransactionsService {
  constructor(private fastify: FastifyInstance) {}

  async list(filters: TransactionFilters): Promise<TransactionListResult> {
    const db = this.fastify.db
    const page = filters.page || 1
    const pageSize = filters.pageSize || 50
    const offset = (page - 1) * pageSize

    // Construir condições WHERE
    const conditions = []

    if (filters.from) {
      conditions.push(gte(transactions.data, filters.from))
    }
    if (filters.to) {
      conditions.push(lte(transactions.data, filters.to))
    }
    if (filters.category && filters.category.length > 0) {
      conditions.push(inArray(transactions.categoria, filters.category))
    }
    if (filters.subcategory && filters.subcategory.length > 0) {
      conditions.push(inArray(transactions.subcategoria, filters.subcategory))
    }
    if (filters.type && filters.type.length > 0) {
      conditions.push(inArray(transactions.tipo, filters.type))
    }
    if (filters.paymentMethod && filters.paymentMethod.length > 0) {
      conditions.push(inArray(transactions.meioPagamento, filters.paymentMethod))
    }
    if (filters.q) {
      const searchTerm = `%${filters.q}%`
      conditions.push(
        like(transactions.descricaoOriginal, searchTerm)
        // Adicionar outros campos de busca se necessário
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Ordenação
    let orderBy
    if (filters.sort) {
      const [field, direction] = filters.sort.startsWith('-') 
        ? [filters.sort.slice(1), 'desc'] 
        : [filters.sort, 'asc']
      
      if (field === 'data') {
        orderBy = direction === 'desc' ? desc(transactions.data) : asc(transactions.data)
      } else if (field === 'valor') {
        orderBy = direction === 'desc' ? desc(transactions.valor) : asc(transactions.valor)
      }
    } else {
      orderBy = desc(transactions.data) // default
    }

    // Buscar total
    const totalResult = await db.select({ count: transactions.id }).from(transactions).where(whereClause)
    const total = totalResult.length

    // Buscar itens
    const items = await db.select()
      .from(transactions)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset)

    return {
      items,
      page,
      pageSize,
      total
    }
  }
}
