import { and, gte, lte, sql, inArray } from "drizzle-orm";
import { transactions, paymentMethods } from "../schema/index";
import type { FastifyInstance } from "fastify";

export interface DashboardFilters {
  userId?: number;
  from?: string;
  to?: string;

  // Filtros por string (compatibilidade)
  categories?: string;
  subcategories?: string;
  paymentMethods?: string;

  // Filtros por ID (novo - preferencial)
  categoryIds?: string;
  subcategoryIds?: string;
  paymentMethodIds?: string;

  q?: string;
}

export interface OverviewResult {
  totalEntradas: number;
  totalSaidas: number;
  saldoFinalEstimado: number;
  tarifas: number;
  investimentosAportes: number;
}

export interface CategoryResult {
  categoria: string;
  subcategoria: string | null;
  qty: number;
  total: number;
  ticketMedio: number;
}

export interface SeriesResult {
  seriesEntradas: Array<{ x: string; y: number }>;
  seriesSaidas: Array<{ x: string; y: number }>;
}

export interface TopSubcategoryResult {
  subcategoria: string;
  categoria: string;
  total: number;
}

export class DashboardService {
  constructor(private fastify: FastifyInstance) {}

  private async getPaymentMethodIds(codes: string[]): Promise<number[]> {
    if (codes.length === 0) return [];

    const db = this.fastify.db;
    const result = await db
      .select({ id: paymentMethods.id })
      .from(paymentMethods)
      .where(inArray(paymentMethods.code, codes));

    return result.map((r) => r.id);
  }

  private async buildBaseConditions(filters: DashboardFilters) {
    const baseConditions = [];

    // Filtros de data
    if (filters.from) {
      baseConditions.push(gte(transactions.date, filters.from));
    }
    if (filters.to) {
      baseConditions.push(lte(transactions.date, filters.to));
    }

    // FILTROS POR ID (preferencial)
    if (filters.categoryIds) {
      const categoryIdList = filters.categoryIds
        .split(",")
        .map((id) => parseInt(id))
        .filter((id) => !isNaN(id));
      if (categoryIdList.length > 0) {
        baseConditions.push(inArray(transactions.category_id, categoryIdList));
      }
    }

    if (filters.subcategoryIds) {
      const subcategoryIdList = filters.subcategoryIds
        .split(",")
        .map((id) => parseInt(id))
        .filter((id) => !isNaN(id));
      if (subcategoryIdList.length > 0) {
        baseConditions.push(
          inArray(transactions.subcategory_id, subcategoryIdList),
        );
      }
    }

    if (filters.paymentMethodIds) {
      const pmIdList = filters.paymentMethodIds
        .split(",")
        .map((id) => parseInt(id))
        .filter((id) => !isNaN(id));
      if (pmIdList.length > 0) {
        baseConditions.push(inArray(transactions.payment_method_id, pmIdList));
      }
    } else if (filters.paymentMethods) {
      // Fallback: filtro por código (compatibilidade)
      const paymentList = filters.paymentMethods.split(",").filter(Boolean);
      if (paymentList.length > 0) {
        const pmIds = await this.getPaymentMethodIds(paymentList);
        if (pmIds.length > 0) {
          baseConditions.push(inArray(transactions.payment_method_id, pmIds));
        }
      }
    }

    // Busca textual
    if (filters.q) {
      const searchTerm = `%${filters.q.toLowerCase()}%`;
      baseConditions.push(
        sql`(
          LOWER(${transactions.description}) LIKE ${searchTerm} OR 
          LOWER(${transactions.merchant}) LIKE ${searchTerm}
        )`,
      );
    }

    return baseConditions.length > 0 ? and(...baseConditions) : undefined;
  }

  async overview(filters: DashboardFilters): Promise<OverviewResult> {
    const db = this.fastify.db;
    const baseWhere = await this.buildBaseConditions(filters);

    // 1. Entradas (type='credito' e não interna)
    const entradasResult = await db.execute(sql`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE type = 'income'
        AND is_internal_transfer = 0
        AND (category_id <> 603 or subcategory_id <> 603)
        ${baseWhere ? sql`AND ${baseWhere}` : sql``}
    `);

    // 2. Saídas (type='debito', não interna, não fatura, não investimento)
    const saidasResult = await db.execute(sql`
      SELECT COALESCE(SUM(ABS(amount)), 0) as total
      FROM transactions
      WHERE type = 'spend'
        AND is_internal_transfer = 0
        AND is_card_bill_payment = 0
        AND is_investment = 0
        ${baseWhere ? sql`AND ${baseWhere}` : sql``}
    `);

    // 3. Tarifas (type='debito', não interna, não fatura, não investimento, categoria de tarifa)
    const tarifasResult = await db.execute(sql`
      SELECT COALESCE(SUM(ABS(amount)), 0) as total
      FROM transactions
      WHERE type = 'spend'
        AND is_internal_transfer = 0
        AND is_card_bill_payment = 1
        AND is_investment = 0
        ${baseWhere ? sql`AND ${baseWhere}` : sql``}
    `);

    // 4. Investimentos (aportes) - type='debito' e is_investment=1
    const investimentosResult = await db.execute(sql`
      SELECT COALESCE(SUM(ABS(amount)), 0) as total
      FROM transactions
      WHERE type = 'spend'
        AND is_internal_transfer = 0
        AND is_card_bill_payment = 0
        AND is_investment = 1
        ${baseWhere ? sql`AND ${baseWhere}` : sql``}
    `);

    const totalEntradas = Number(entradasResult.rows[0]?.total) || 0;
    const totalSaidas = Number(saidasResult.rows[0]?.total) || 0;
    const tarifas = Number(tarifasResult.rows[0]?.total) || 0;
    const investimentosAportes =
      Number(investimentosResult.rows[0]?.total) || 0;

    return {
      totalEntradas,
      totalSaidas,
      saldoFinalEstimado: totalEntradas - (totalSaidas + tarifas),
      tarifas,
      investimentosAportes,
    };
  }

  async byCategory(filters: DashboardFilters): Promise<CategoryResult[]> {
    const db = this.fastify.db;
    const baseWhere = await this.buildBaseConditions(filters);

    // Buscar apenas gastos de consumo (excluir internas, fatura, investimentos)
    const result = await db.execute(sql`
      SELECT 
        COALESCE(categories.name, 'Sem categoria') as categoria,
        COALESCE(categories.name, '') as subcategoria,
        COUNT(*) as qty,
        SUM(ABS(amount)) as total,
        AVG(CASE WHEN ABS(amount) > 0 THEN ABS(amount) END) as ticket_medio
      FROM transactions
      INNER JOIN categories ON (transactions.category_id = categories.id) OR (transactions.subcategory_id = categories.id)
      WHERE type = 'spend'
        AND is_internal_transfer = 0
        AND is_card_bill_payment = 0
        AND is_investment = 0
        ${baseWhere ? sql`AND ${baseWhere}` : sql``}
      GROUP BY categories.name, categories.name
      ORDER BY total DESC
      LIMIT 50
    `);

    return result.rows.map((row: any) => ({
      categoria: row.categoria,
      subcategoria: row.subcategoria,
      qty: row.qty,
      total: row.total,
      ticketMedio: row.ticket_medio,
    }));
  }

  async series(
    filters: DashboardFilters,
    groupBy: "day" | "week" | "month" = "day",
  ): Promise<SeriesResult> {
    const db = this.fastify.db;
    const baseWhere = await this.buildBaseConditions(filters);

    // Determinar agrupamento por período
    let groupByExpression = "date";
    if (groupBy === "week") {
      groupByExpression = "to_char(date::date, 'YYYY-WW'::text)";
    } else if (groupBy === "month") {
      groupByExpression = "to_char(date::date, 'YYYY-MM'::text)";
    }

    // Entradas por período
    const entradasResult = await db.execute(sql`
      SELECT 
        ${sql.raw(groupByExpression)} as period,
        SUM(amount) as entradas
      FROM transactions
      WHERE type = 'income'
        AND is_internal_transfer = 0
        ${baseWhere ? sql`AND ${baseWhere}` : sql``}
      GROUP BY ${sql.raw(groupByExpression)}
      ORDER BY period
    `);

    // Saídas por período
    const saidasResult = await db.execute(sql`
      SELECT 
        ${sql.raw(groupByExpression)} as period,
        SUM(ABS(amount)) as saidas
      FROM transactions
      WHERE type = 'spend'
        AND is_internal_transfer = 0
        AND is_card_bill_payment = 0
        AND is_investment = 0
        ${baseWhere ? sql`AND ${baseWhere}` : sql``}
      GROUP BY ${sql.raw(groupByExpression)}
      ORDER BY period
    `);

    // Combinar resultados por período
    const periodMap = new Map();

    entradasResult.rows.forEach((row: any) => {
      periodMap.set(row.period, {
        x: row.period,
        entradas: row.entradas || 0,
        saidas: 0,
      });
    });

    saidasResult.rows.forEach((row: any) => {
      const existing = periodMap.get(row.period);
      if (existing) {
        existing.saidas = row.saidas || 0;
      } else {
        periodMap.set(row.period, {
          x: row.period,
          entradas: 0,
          saidas: row.saidas || 0,
        });
      }
    });

    const combinedResults = Array.from(periodMap.values()).sort((a, b) =>
      a.x.localeCompare(b.x),
    );

    return {
      seriesEntradas: combinedResults.map((r) => ({ x: r.x, y: r.entradas })),
      seriesSaidas: combinedResults.map((r) => ({ x: r.x, y: r.saidas })),
    };
  }

  async topSubcategories(
    filters: DashboardFilters,
  ): Promise<TopSubcategoryResult[]> {
    const db = this.fastify.db;
    const baseWhere = await this.buildBaseConditions(filters);

    // Buscar top 10 subcategorias (apenas gastos de consumo)
    const result = await db.execute(sql`
      SELECT 
        COALESCE(subcategories.name, '—') as subcategoria,
        COALESCE(categories.name, 'Sem categoria') as categoria,
        SUM(ABS(amount)) as total
      FROM transactions
      inner join categories on transactions.category_id = categories.id
      inner join categories as subcategories on transactions.subcategory_id = subcategories.id
      WHERE type = 'spend'
        AND is_internal_transfer = 0
        AND is_card_bill_payment = 0
        AND is_investment = 0
        ${baseWhere ? sql`AND ${baseWhere}` : sql``}
      GROUP BY subcategories.name, categories.name
      ORDER BY total DESC
      LIMIT 10
    `);

    return result.rows.map((row: any) => ({
      subcategoria: row.subcategoria,
      categoria: row.categoria,
      total: row.total,
    }));
  }
}
