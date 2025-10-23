import { eq, and, gte, lte, like, inArray, desc, asc, sql } from 'drizzle-orm'
import { transactions, paymentMethods, banks } from '../schema/index'
import type { FastifyInstance } from 'fastify'

export interface TransactionFilters {
  userId?: number
  from?: string
  to?: string
  
  // Filtros por string (compatibilidade)
  category?: string
  subcategory?: string
  
  // Filtros por ID (novo - preferencial)
  categoryIds?: string
  subcategoryIds?: string
  paymentMethodIds?: string
  
  // Filtros existentes
  categoryId?: number
  subcategoryId?: number
  type?: string
  paymentMethodId?: number
  paymentCode?: string
  q?: string
  includeTransfers?: boolean
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
    try {
      const db = this.fastify.db
      const page = filters.page || 1
      const pageSize = filters.pageSize || 20
      const offset = (page - 1) * pageSize

      // Construir condições WHERE
      const conditions = []

      // Filtros de data
      if (filters.from) {
        conditions.push(gte(transactions.data, filters.from))
      }
      if (filters.to) {
        conditions.push(lte(transactions.data, filters.to))
      }

      // Filtro de transferências internas
      if (filters.includeTransfers === false) {
        conditions.push(eq(transactions.isInternalTransfer, 0))
      }

      // Filtros de categoria
      if (filters.categoryIds) {
        const categoryIdList = filters.categoryIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
        if (categoryIdList.length > 0) {
          conditions.push(inArray(transactions.categoryId, categoryIdList))
        }
      } else if (filters.category) {
        conditions.push(eq(transactions.categoria, filters.category))
      }
      
      if (filters.subcategoryIds) {
        const subcategoryIdList = filters.subcategoryIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
        if (subcategoryIdList.length > 0) {
          conditions.push(inArray(transactions.subcategoryId, subcategoryIdList))
        }
      } else if (filters.subcategory) {
        conditions.push(eq(transactions.subcategoria, filters.subcategory))
      }
      
      // Filtros existentes (compatibilidade)
      if (filters.categoryId) {
        conditions.push(eq(transactions.categoryId, filters.categoryId))
      }
      if (filters.subcategoryId) {
        conditions.push(eq(transactions.subcategoryId, filters.subcategoryId))
      }

      // Filtro de tipo
      if (filters.type) {
        conditions.push(eq(transactions.tipo, filters.type))
      }

      // Filtro de método de pagamento por IDs
      if (filters.paymentMethodIds) {
        const pmIdList = filters.paymentMethodIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
        if (pmIdList.length > 0) {
          conditions.push(inArray(transactions.paymentMethodId, pmIdList))
        }
      } else if (filters.paymentMethodId) {
        conditions.push(eq(transactions.paymentMethodId, filters.paymentMethodId))
      }

      // Busca textual
      if (filters.q) {
        const searchTerm = `%${filters.q.toLowerCase()}%`
        conditions.push(
          sql`(LOWER(${transactions.descricaoOriginal}) LIKE ${searchTerm} OR LOWER(${transactions.estabelecimento}) LIKE ${searchTerm})`
        )
      }

      // Filtro por paymentCode (requer JOIN)
      let paymentCodeCondition = undefined
      if (filters.paymentCode) {
        paymentCodeCondition = eq(paymentMethods.code, filters.paymentCode)
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      // Ordenação
      let orderBy
      if (filters.sort) {
        const [field, direction] = filters.sort.startsWith('-') 
          ? [filters.sort.slice(1), 'desc'] 
          : [filters.sort, 'asc']
        
        const sortDirection = direction === 'desc' ? desc : asc
        
        if (field === 'data') {
          orderBy = sortDirection(transactions.data)
        } else if (field === 'valor') {
          orderBy = sortDirection(transactions.valor)
        } else if (field === 'categoria') {
          orderBy = sortDirection(transactions.categoria)
        } else if (field === 'confianca_classificacao') {
          orderBy = sortDirection(transactions.confiancaClassificacao)
        } else {
          orderBy = desc(transactions.data) // fallback
        }
      } else {
        orderBy = desc(transactions.data) // default
      }

      // Buscar total - usar count() para melhor performance
      const totalResult = await db.select({ count: sql`count(*)` }).from(transactions).where(whereClause)
      const total = Number(totalResult[0]?.count) || 0

      // Buscar itens com JOIN para payment methods
      const items = await db
        .select({
          id: transactions.id,
          statementId: transactions.statementId,
          data: transactions.data,
          descricaoOriginal: transactions.descricaoOriginal,
          estabelecimento: transactions.estabelecimento,
          cnpj: transactions.cnpj,
          tipo: transactions.tipo,
          valor: transactions.valor,
          categoria: transactions.categoria,
          subcategoria: transactions.subcategoria,
          categoryId: transactions.categoryId,
          subcategoryId: transactions.subcategoryId,
          isInternalTransfer: transactions.isInternalTransfer,
          isCardBillPayment: transactions.isCardBillPayment,
          isInvestment: transactions.isInvestment,
          isRefundOrChargeback: transactions.isRefundOrChargeback,
          paymentMethodId: transactions.paymentMethodId,
          meioPagamento: transactions.meioPagamento,
          bankId: transactions.bankId,
          bancoOrigem: transactions.bancoOrigem,
          observacoes: transactions.observacoes,
          confiancaClassificacao: transactions.confiancaClassificacao,
          idTransacao: transactions.idTransacao,
          createdAt: transactions.createdAt,
          paymentCode: paymentMethods.code,
          paymentLabel: paymentMethods.label,
          bankCode: banks.code,
          bankName: banks.name
        })
        .from(transactions)
        .leftJoin(paymentMethods, eq(transactions.paymentMethodId, paymentMethods.id))
        .leftJoin(banks, eq(transactions.bankId, banks.id))
        .where(and(
          whereClause,
          paymentCodeCondition
        ))
        .orderBy(orderBy)
        .limit(pageSize)
        .offset(offset)

      return {
        items,
        page,
        pageSize,
        total
      }
    } catch (error) {
      this.fastify.log.error('Erro no TransactionsService.list:', error)
      throw error
    }
  }
}
