import { eq, and, gte, lte, inArray, desc, asc, sql } from "drizzle-orm";
import { transactions, paymentMethods, banks } from "../schema/index";
import type { FastifyInstance } from "fastify";

export interface TransactionFilters {
  userId?: number;
  from?: string;
  to?: string;

  // Filtros por string (compatibilidade)
  category?: string;
  subcategory?: string;

  // Filtros por ID (novo - preferencial)
  categoryIds?: string;
  subcategoryIds?: string;
  paymentMethodIds?: string;

  // Filtros existentes
  categoryId?: number;
  subcategoryId?: number;
  type?: string;
  paymentMethodId?: number;
  paymentCode?: string;
  q?: string;
  includeTransfers?: boolean;
  page?: number;
  pageSize?: number;
  sort?: string;
}

export interface TransactionListResult {
  items: any[];
  page: number;
  pageSize: number;
  total: number;
}

export class TransactionsService {
  constructor(private fastify: FastifyInstance) {}

  async list(filters: TransactionFilters): Promise<TransactionListResult> {
    try {
      const db = this.fastify.db;
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const offset = (page - 1) * pageSize;

      // Construir condições WHERE
      const conditions = [];

      // Filtros de data
      if (filters.from) {
        conditions.push(gte(transactions.date, filters.from));
      }
      if (filters.to) {
        conditions.push(lte(transactions.date, filters.to));
      }

      // Filtro de transferências internas
      if (filters.includeTransfers === false) {
        conditions.push(eq(transactions.is_internal_transfer, 0));
      }

      // Filtros de categoria
      if (filters.categoryIds) {
        const categoryIdList = filters.categoryIds
          .split(",")
          .map((id) => parseInt(id))
          .filter((id) => !isNaN(id));
        if (categoryIdList.length > 0) {
          conditions.push(inArray(transactions.category_id, categoryIdList));
        }
      }

      if (filters.subcategoryIds) {
        const subcategoryIdList = filters.subcategoryIds
          .split(",")
          .map((id) => parseInt(id))
          .filter((id) => !isNaN(id));
        if (subcategoryIdList.length > 0) {
          conditions.push(
            inArray(transactions.subcategory_id, subcategoryIdList),
          );
        }
      }

      // Filtros existentes (compatibilidade)
      if (filters.categoryId) {
        conditions.push(eq(transactions.category_id, filters.categoryId));
      }
      if (filters.subcategoryId) {
        conditions.push(eq(transactions.subcategory_id, filters.subcategoryId));
      }

      // Filtro de tipo
      if (filters.type) {
        conditions.push(
          eq(transactions.type, filters.type as "income" | "spend"),
        );
      }

      // Filtro de método de pagamento por IDs
      if (filters.paymentMethodIds) {
        const pmIdList = filters.paymentMethodIds
          .split(",")
          .map((id) => parseInt(id))
          .filter((id) => !isNaN(id));
        if (pmIdList.length > 0) {
          conditions.push(inArray(transactions.payment_method_id, pmIdList));
        }
      } else if (filters.paymentMethodId) {
        conditions.push(
          eq(transactions.payment_method_id, filters.paymentMethodId),
        );
      }

      // Busca textual
      if (filters.q) {
        const searchTerm = `%${filters.q.toLowerCase()}%`;
        conditions.push(
          sql`(LOWER(${transactions.description}) LIKE ${searchTerm} OR LOWER(${transactions.merchant}) LIKE ${searchTerm})`,
        );
      }

      // Filtro por paymentCode (requer JOIN)
      let paymentCodeCondition = undefined;
      if (filters.paymentCode) {
        paymentCodeCondition = eq(paymentMethods.code, filters.paymentCode);
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Ordenação
      let orderBy;
      if (filters.sort) {
        const [field, direction] = filters.sort.startsWith("-")
          ? [filters.sort.slice(1), "desc"]
          : [filters.sort, "asc"];

        const sortDirection = direction === "desc" ? desc : asc;

        if (field === "data") {
          orderBy = sortDirection(transactions.date);
        } else if (field === "valor") {
          orderBy = sortDirection(transactions.amount);
        } else if (field === "categoria") {
          orderBy = sortDirection(transactions.category_id);
        } else {
          orderBy = desc(transactions.date); // fallback
        }
      } else {
        orderBy = desc(transactions.date); // default
      }

      // Buscar total - usar count() para melhor performance
      const totalResult = await db
        .select({ count: sql`count(*)` })
        .from(transactions)
        .where(whereClause);
      const total = Number(totalResult[0]?.count) || 0;

      // Buscar itens com JOIN para payment methods e categorias
      const items = await db
        .select({
          id: transactions.id,
          statement_id: transactions.statement_id,
          date: transactions.date,
          description: transactions.description,
          merchant: transactions.merchant,
          type: transactions.type,
          amount: transactions.amount,
          category_id: transactions.category_id,
          subcategory_id: transactions.subcategory_id,
          is_internal_transfer: transactions.is_internal_transfer,
          is_card_bill_payment: transactions.is_card_bill_payment,
          is_investment: transactions.is_investment,
          payment_method_id: transactions.payment_method_id,
          payment_method: transactions.payment_method,
          bank_id: transactions.bank_id,
          bank_name: transactions.bank_name,
          created_at: transactions.created_at,
          paymentCode: paymentMethods.code,
          paymentLabel: paymentMethods.label,
          bankCode: banks.code,
          bankName: banks.name,
          category: sql<string>`category.name`.as("category"),
          subcategory: sql<string>`subcategory.name`.as("subcategory"),
        })
        .from(transactions)
        .leftJoin(
          paymentMethods,
          eq(transactions.payment_method_id, paymentMethods.id),
        )
        .leftJoin(banks, eq(transactions.bank_id, banks.id))
        .leftJoin(
          sql`categories as category`,
          sql`transactions.category_id = category.id`,
        )
        .leftJoin(
          sql`categories as subcategory`,
          sql`transactions.subcategory_id = subcategory.id`,
        )
        .where(and(whereClause, paymentCodeCondition))
        .orderBy(orderBy)
        .limit(pageSize)
        .offset(offset);

      return {
        items,
        page,
        pageSize,
        total,
      };
    } catch (error) {
      this.fastify.log.error("Erro no TransactionsService.list:");
      throw error;
    }
  }
}
