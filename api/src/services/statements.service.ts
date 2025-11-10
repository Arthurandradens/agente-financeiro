import { eq } from 'drizzle-orm'
import { statements, transactions, users, paymentMethods, banks } from '../schema/index'
// import { generateHashId } from '../utils/hash' // Removed unused import
import type { FastifyInstance } from 'fastify'

export interface IngestResult {
  statementId: number
  inserted: number
  duplicates: number
}

export class StatementsService {
  constructor(private fastify: FastifyInstance) {}

  async ingestBatch(
    userId: number,
    periodStart: string,
    periodEnd: string,
    sourceFile: string,
    transacoes: any[],
    bankId?: number
  ): Promise<IngestResult> {
    const db = this.fastify.db
    
    if (!db) {
      this.fastify.log.error('Database not available in service')
      throw new Error('Database not initialized')
    }

    // Garantir que o usuário existe (criar se não existir)
    await this.ensureUserExists(db, userId)

    // Validar bank_id se fornecido
    let bankName = null
    if (bankId) {
      const bank = await db.select().from(banks).where(eq(banks.id, bankId)).limit(1)
      if (!bank.length) {
        throw new Error(`Invalid bank_id: ${bankId}`)
      }
      bankName = bank[0]?.name || null
    }

    // Criar statement
    const [statement] = await db.insert(statements).values({
      user_id: userId,
      period_start: periodStart,
      period_end: periodEnd,
      source_file: sourceFile
    }).returning()

    let inserted = 0
    let duplicates = 0

    // Inserir transações
    for (const tx of transacoes) {
      // Processar payment_method_id e preencher payment_method
      let paymentMethod = tx.payment_method
      if (tx.payment_method_id) {
        // Validar que o payment_method_id existe
        const pm = await db.select().from(paymentMethods).where(eq(paymentMethods.id, tx.payment_method_id)).limit(1)
        if (!pm.length) {
          throw new Error(`Invalid payment_method_id: ${tx.payment_method_id}`)
        }
        // Preencher payment_method automaticamente com o label
        paymentMethod = pm[0]?.label || ''
      }
      
      try {
        await db.insert(transactions).values({
          statement_id: statement?.id || null,
          date: tx.date,
          description: tx.description,
          merchant: tx.counterparty_normalized || null,
          type: tx.type, // já vem como 'income' ou 'spend'
          amount: tx.amount,
          category_id: tx.category_id,
          subcategory_id: tx.subcategory_id,
          is_internal_transfer: tx.is_internal_transfer || 0,
          is_card_bill_payment: tx.is_card_bill_payment || 0,
          is_investment: (tx.is_investment_aporte || 0) || (tx.is_investment_rendimento || 0) ? 1 : 0, // qualquer flag de investimento
          payment_method_id: tx.payment_method_id,
          payment_method: paymentMethod, // deprecated mas mantido
          bank_id: bankId || null,
          bank_name: bankName // deprecated mas mantido
        })
        inserted++
      } catch (error: any) {
        // Se for erro de unique constraint, é duplicado
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.code === '23505') {
          duplicates++
        } else {
          throw error
        }
      }
    }

    return {
      statementId: statement?.id || 0,
      inserted,
      duplicates
    }
  }

  private async ensureUserExists(db: any, userId: number) {
    // Verificar se o usuário existe
    const existingUser = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    
    if (existingUser.length === 0) {
      // Criar usuário padrão se não existir
      await db.insert(users).values({
        id: userId,
        name: `User ${userId}`,
        email: `user${userId}@example.com`
      })
      this.fastify.log.info(`Created default user ${userId}`)
    }
  }

  async getStatement(statementId: number) {
    const db = this.fastify.db
    return await db.select().from(statements).where(eq(statements.id, statementId)).limit(1)
  }
}
