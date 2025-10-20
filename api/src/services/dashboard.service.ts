import { and, gte, lte, sql, inArray } from 'drizzle-orm'
import { transactions, paymentMethods } from '../schema/index'
import type { FastifyInstance } from 'fastify'

export interface DashboardFilters {
  userId?: number
  from?: string
  to?: string
  
  // Filtros por string (compatibilidade)
  categories?: string
  subcategories?: string
  paymentMethods?: string
  
  // Filtros por ID (novo - preferencial)
  categoryIds?: string
  subcategoryIds?: string
  paymentMethodIds?: string
  
  q?: string
}

export interface OverviewResult {
  totalEntradas: number
  totalSaidas: number
  saldoFinalEstimado: number
  tarifas: number
  investimentosAportes: number
}

export interface CategoryResult {
  categoria: string
  subcategoria: string | null
  qty: number
  total: number
  ticketMedio: number
}

export interface SeriesResult {
  seriesEntradas: Array<{ x: string; y: number }>
  seriesSaidas: Array<{ x: string; y: number }>
}

export interface TopSubcategoryResult {
  subcategoria: string
  categoria: string
  total: number
}

export class DashboardService {
  constructor(private fastify: FastifyInstance) {}

  private async getPaymentMethodIds(codes: string[]): Promise<number[]> {
    if (codes.length === 0) return []
    
    const db = this.fastify.db
    const result = await db.select({ id: paymentMethods.id })
      .from(paymentMethods)
      .where(inArray(paymentMethods.code, codes))
    
    return result.map(r => r.id)
  }

  private async buildBaseConditions(filters: DashboardFilters) {
    const baseConditions = []
    
    // Filtros de data
    if (filters.from) {
      baseConditions.push(gte(transactions.data, filters.from))
    }
    if (filters.to) {
      baseConditions.push(lte(transactions.data, filters.to))
    }
    
    // FILTROS POR ID (preferencial)
    if (filters.categoryIds) {
      const categoryIdList = filters.categoryIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
      if (categoryIdList.length > 0) {
        baseConditions.push(inArray(transactions.categoryId, categoryIdList))
      }
    } else if (filters.categories) {
      // Fallback: filtro por string (compatibilidade)
      const categoryList = filters.categories.split(',').filter(Boolean)
      if (categoryList.length > 0) {
        baseConditions.push(inArray(transactions.categoria, categoryList))
      }
    }

    if (filters.subcategoryIds) {
      const subcategoryIdList = filters.subcategoryIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
      if (subcategoryIdList.length > 0) {
        baseConditions.push(inArray(transactions.subcategoryId, subcategoryIdList))
      }
    } else if (filters.subcategories) {
      // Fallback: filtro por string (compatibilidade)
      const subcategoryList = filters.subcategories.split(',').filter(Boolean)
      if (subcategoryList.length > 0) {
        baseConditions.push(inArray(transactions.subcategoria, subcategoryList))
      }
    }

    if (filters.paymentMethodIds) {
      const pmIdList = filters.paymentMethodIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
      if (pmIdList.length > 0) {
        baseConditions.push(inArray(transactions.paymentMethodId, pmIdList))
      }
    } else if (filters.paymentMethods) {
      // Fallback: filtro por código (compatibilidade)
      const paymentList = filters.paymentMethods.split(',').filter(Boolean)
      if (paymentList.length > 0) {
        const pmIds = await this.getPaymentMethodIds(paymentList)
        if (pmIds.length > 0) {
          baseConditions.push(inArray(transactions.paymentMethodId, pmIds))
        }
      }
    }

    // Busca textual
    if (filters.q) {
      const searchTerm = `%${filters.q.toLowerCase()}%`
      baseConditions.push(
        sql`(
          LOWER(${transactions.descricaoOriginal}) LIKE ${searchTerm} OR 
          LOWER(${transactions.estabelecimento}) LIKE ${searchTerm}
        )`
      )
    }

    return baseConditions.length > 0 ? and(...baseConditions) : undefined
  }

  async overview(filters: DashboardFilters): Promise<OverviewResult> {
    const db = this.fastify.db
    const baseWhere = await this.buildBaseConditions(filters)

    // 1. Entradas (tipo='credito' e não interna)
    const entradasResult = await db.get(sql`
      SELECT COALESCE(SUM(valor), 0) as total
      FROM transactions
      WHERE tipo = 'credito'
        AND is_internal_transfer = 0
        AND (subcategory_id <> 603 or subcategory_id is null)
        ${baseWhere ? sql`AND ${baseWhere}` : sql``}
    `)

    // 2. Saídas (tipo='debito', não interna, não fatura, não investimento)
    const saidasResult = await db.get(sql`
      SELECT COALESCE(SUM(ABS(valor)), 0) as total
      FROM transactions
      WHERE tipo = 'debito'
        AND is_internal_transfer = 0
        AND is_card_bill_payment = 0
        AND is_investment = 0
        ${baseWhere ? sql`AND ${baseWhere}` : sql``}
    `)

    // 3. Tarifas (tipo='debito', não interna, não fatura, não investimento, categoria de tarifa)
    const tarifasResult = await db.get(sql`
      SELECT COALESCE(SUM(ABS(valor)), 0) as total
      FROM transactions
      WHERE tipo = 'debito'
        AND is_internal_transfer = 0
        AND is_card_bill_payment = 1
        AND is_investment = 0
        ${baseWhere ? sql`AND ${baseWhere}` : sql``}
    `)

    // 4. Investimentos (aportes) - tipo='debito' e is_investment=1
    const investimentosResult = await db.get(sql`
      SELECT COALESCE(SUM(ABS(valor)), 0) as total
      FROM transactions
      WHERE tipo = 'debito'
        AND is_internal_transfer = 0
        AND is_card_bill_payment = 0
        AND is_investment = 1
        ${baseWhere ? sql`AND ${baseWhere}` : sql``}
    `)

    const totalEntradas = (entradasResult as any)?.total || 0
    const totalSaidas = (saidasResult as any)?.total || 0
    const tarifas = (tarifasResult as any)?.total || 0
    const investimentosAportes = (investimentosResult as any)?.total || 0

    return {
      totalEntradas,
      totalSaidas,
      saldoFinalEstimado: totalEntradas - (totalSaidas + tarifas),
      tarifas,
      investimentosAportes
    }
  }

  async byCategory(filters: DashboardFilters): Promise<CategoryResult[]> {
    const db = this.fastify.db
    const baseWhere = await this.buildBaseConditions(filters)

    // Buscar apenas gastos de consumo (excluir internas, fatura, investimentos)
    const result = await db.all(sql`
      SELECT 
        COALESCE(categoria, 'Sem categoria') as categoria,
        COALESCE(subcategoria, '') as subcategoria,
        COUNT(*) as qty,
        ROUND(SUM(ABS(valor)), 2) as total,
        ROUND(AVG(CASE WHEN ABS(valor) > 0 THEN ABS(valor) END), 2) as ticket_medio
      FROM transactions
      WHERE tipo = 'debito'
        AND is_internal_transfer = 0
        AND is_card_bill_payment = 0
        AND is_investment = 0
        ${baseWhere ? sql`AND ${baseWhere}` : sql``}
      GROUP BY categoria, subcategoria
      ORDER BY total DESC
      LIMIT 50
    `)

    return result.map((row: any) => ({
      categoria: row.categoria,
      subcategoria: row.subcategoria,
      qty: row.qty,
      total: row.total,
      ticketMedio: row.ticket_medio
    }))
  }

  async series(filters: DashboardFilters, groupBy: 'day' | 'week' | 'month' = 'day'): Promise<SeriesResult> {
    const db = this.fastify.db
    const baseWhere = await this.buildBaseConditions(filters)

    // Determinar agrupamento por período
    let groupByExpression = 'data'
    if (groupBy === 'week') {
      groupByExpression = "strftime('%Y-%W', data)"
    } else if (groupBy === 'month') {
      groupByExpression = "strftime('%Y-%m', data)"
    }

    // Entradas por período
    const entradasResult = await db.all(sql`
      SELECT 
        ${sql.raw(groupByExpression)} as period,
        ROUND(SUM(valor), 2) as entradas
      FROM transactions
      WHERE tipo = 'credito'
        AND is_internal_transfer = 0
        ${baseWhere ? sql`AND ${baseWhere}` : sql``}
      GROUP BY ${sql.raw(groupByExpression)}
      ORDER BY period
    `)

    // Saídas por período
    const saidasResult = await db.all(sql`
      SELECT 
        ${sql.raw(groupByExpression)} as period,
        ROUND(SUM(ABS(valor)), 2) as saidas
      FROM transactions
      WHERE tipo = 'debito'
        AND is_internal_transfer = 0
        AND is_card_bill_payment = 0
        AND is_investment = 0
        ${baseWhere ? sql`AND ${baseWhere}` : sql``}
      GROUP BY ${sql.raw(groupByExpression)}
      ORDER BY period
    `)

    // Combinar resultados por período
    const periodMap = new Map()
    
    entradasResult.forEach((row: any) => {
      periodMap.set(row.period, { x: row.period, entradas: row.entradas || 0, saidas: 0 })
    })
    
    saidasResult.forEach((row: any) => {
      const existing = periodMap.get(row.period)
      if (existing) {
        existing.saidas = row.saidas || 0
      } else {
        periodMap.set(row.period, { x: row.period, entradas: 0, saidas: row.saidas || 0 })
      }
    })

    const combinedResults = Array.from(periodMap.values()).sort((a, b) => a.x.localeCompare(b.x))

    return {
      seriesEntradas: combinedResults.map(r => ({ x: r.x, y: r.entradas })),
      seriesSaidas: combinedResults.map(r => ({ x: r.x, y: r.saidas }))
    }
  }

  async topSubcategories(filters: DashboardFilters): Promise<TopSubcategoryResult[]> {
    const db = this.fastify.db
    const baseWhere = await this.buildBaseConditions(filters)

    // Buscar top 10 subcategorias (apenas gastos de consumo)
    const result = await db.all(sql`
      SELECT 
        COALESCE(subcategoria, '—') as subcategoria,
        COALESCE(categoria, 'Sem categoria') as categoria,
        ROUND(SUM(ABS(valor)), 2) as total
      FROM transactions
      WHERE tipo = 'debito'
        AND is_internal_transfer = 0
        AND is_card_bill_payment = 0
        AND is_investment = 0
        ${baseWhere ? sql`AND ${baseWhere}` : sql``}
      GROUP BY subcategoria, categoria
      ORDER BY total DESC
      LIMIT 10
    `)

    return result.map((row: any) => ({
      subcategoria: row.subcategoria,
      categoria: row.categoria,
      total: row.total
    }))
  }
}
