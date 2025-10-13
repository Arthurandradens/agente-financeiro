import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { transactions } from '../schema/index.js'
import { isTransferenciaInterna, isPagamentoFatura, formatDateForGrouping } from '../utils/dates.js'
import type { FastifyInstance } from 'fastify'

export interface DashboardFilters {
  userId?: number
  from?: string
  to?: string
}

export interface OverviewResult {
  totalEntradas: number
  totalSaidas: number
  saldoFinalEstimado: number
  tarifas: number
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

export class DashboardService {
  constructor(private fastify: FastifyInstance) {}

  async overview(filters: DashboardFilters): Promise<OverviewResult> {
    const db = this.fastify.db

    // Construir condições WHERE
    const conditions = []
    if (filters.from) {
      conditions.push(gte(transactions.data, filters.from))
    }
    if (filters.to) {
      conditions.push(lte(transactions.data, filters.to))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Buscar todas as transações para aplicar exclusões
    const allTransactions = await db.select()
      .from(transactions)
      .where(whereClause)

    let totalEntradas = 0
    let totalSaidas = 0
    let tarifas = 0

    for (const tx of allTransactions) {
      // Aplicar exclusões
      if (isTransferenciaInterna(tx.categoria, tx.observacoes || '')) {
        continue
      }
      if (isPagamentoFatura(tx.categoria, tx.subcategoria || '')) {
        continue
      }

      if (tx.tipo === 'credito') {
        totalEntradas += tx.valor
      } else {
        totalSaidas += Math.abs(tx.valor)
      }

      // Calcular tarifas
      if (tx.categoria === 'Serviços financeiros' && tx.subcategoria === 'Tarifas') {
        tarifas += Math.abs(tx.valor)
      }
    }

    return {
      totalEntradas,
      totalSaidas,
      saldoFinalEstimado: totalEntradas - totalSaidas,
      tarifas
    }
  }

  async byCategory(filters: DashboardFilters): Promise<CategoryResult[]> {
    const db = this.fastify.db

    // Construir condições WHERE
    const conditions = []
    if (filters.from) {
      conditions.push(gte(transactions.data, filters.from))
    }
    if (filters.to) {
      conditions.push(lte(transactions.data, filters.to))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Buscar todas as transações
    const allTransactions = await db.select()
      .from(transactions)
      .where(whereClause)

    // Agrupar por categoria/subcategoria
    const categoryMap = new Map<string, { qty: number; total: number }>()

    for (const tx of allTransactions) {
      // Aplicar exclusões
      if (isTransferenciaInterna(tx.categoria, tx.observacoes || '')) {
        continue
      }
      if (isPagamentoFatura(tx.categoria, tx.subcategoria || '')) {
        continue
      }

      const key = `${tx.categoria}|||${tx.subcategoria || ''}`
      const existing = categoryMap.get(key) || { qty: 0, total: 0 }
      
      existing.qty++
      if (tx.tipo === 'debito') {
        existing.total -= Math.abs(tx.valor) // Saídas como negativas
      } else {
        existing.total += tx.valor // Entradas como positivas
      }
      
      categoryMap.set(key, existing)
    }

    // Converter para array de resultados
    const results: CategoryResult[] = []
    for (const [key, data] of categoryMap) {
      const [categoria, subcategoria] = key.split('|||')
      results.push({
        categoria,
        subcategoria: subcategoria || null,
        qty: data.qty,
        total: data.total,
        ticketMedio: data.total / data.qty
      })
    }

    return results.sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
  }

  async series(filters: DashboardFilters, groupBy: 'day' | 'week' | 'month' = 'day'): Promise<SeriesResult> {
    const db = this.fastify.db

    // Construir condições WHERE
    const conditions = []
    if (filters.from) {
      conditions.push(gte(transactions.data, filters.from))
    }
    if (filters.to) {
      conditions.push(lte(transactions.data, filters.to))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Buscar todas as transações
    const allTransactions = await db.select()
      .from(transactions)
      .where(whereClause)

    // Agrupar por período
    const periodMap = new Map<string, { entradas: number; saidas: number }>()

    for (const tx of allTransactions) {
      // Aplicar exclusões
      if (isTransferenciaInterna(tx.categoria, tx.observacoes || '')) {
        continue
      }
      if (isPagamentoFatura(tx.categoria, tx.subcategoria || '')) {
        continue
      }

      const period = formatDateForGrouping(tx.data, groupBy)
      const existing = periodMap.get(period) || { entradas: 0, saidas: 0 }

      if (tx.tipo === 'credito') {
        existing.entradas += tx.valor
      } else {
        existing.saidas += Math.abs(tx.valor)
      }

      periodMap.set(period, existing)
    }

    // Converter para arrays ordenados
    const sortedPeriods = Array.from(periodMap.keys()).sort()
    
    const seriesEntradas = sortedPeriods.map(period => ({
      x: period,
      y: periodMap.get(period)?.entradas || 0
    }))

    const seriesSaidas = sortedPeriods.map(period => ({
      x: period,
      y: periodMap.get(period)?.saidas || 0
    }))

    return {
      seriesEntradas,
      seriesSaidas
    }
  }
}
