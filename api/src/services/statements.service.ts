import { eq } from 'drizzle-orm'
import { statements, transactions, users, paymentMethods, banks } from '../schema/index'
import { generateHashId } from '../utils/hash'
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
      bankName = bank[0].name
    }

    // Criar statement
    const [statement] = await db.insert(statements).values({
      userId,
      periodStart,
      periodEnd,
      sourceFile
    }).returning()

    let inserted = 0
    let duplicates = 0

    // Inserir transações com upsert por id_transacao
    for (const tx of transacoes) {
      const hashId = tx.id_transacao || generateHashId(tx.data, tx.valor, tx.descricao_original)
      
      // Processar payment_method_id e preencher meio_pagamento
      let meioPagamento = tx.meio_pagamento
      if (tx.payment_method_id) {
        // Validar que o payment_method_id existe
        const pm = await db.select().from(paymentMethods).where(eq(paymentMethods.id, tx.payment_method_id)).limit(1)
        if (!pm.length) {
          throw new Error(`Invalid payment_method_id: ${tx.payment_method_id}`)
        }
        // Preencher meio_pagamento automaticamente com o label
        meioPagamento = pm[0].label
      }
      
      try {
        await db.insert(transactions).values({
          statementId: statement.id,
          data: tx.data,
          descricaoOriginal: tx.descricao_original,
          estabelecimento: tx.counterparty_normalized || '',
          cnpj: tx.cnpj,
          tipo: tx.tipo,
          valor: tx.valor,
          categoria: tx.categoria_label || '', // DEPRECATED - manter para compatibilidade
          subcategoria: tx.subcategoria_label || '', // DEPRECATED - manter para compatibilidade
          categoryId: tx.category_id,
          subcategoryId: tx.subcategory_id,
          isInternalTransfer: tx.is_internal_transfer || 0,
          isCardBillPayment: tx.is_card_bill_payment || 0,
          isInvestment: (tx.is_investment_aporte || 0) || (tx.is_investment_rendimento || 0) ? 1 : 0, // qualquer flag de investimento
          isRefundOrChargeback: tx.is_refund_or_chargeback || 0,
          paymentMethodId: tx.payment_method_id,
          meioPagamento: meioPagamento,
          bankId: bankId,
          bancoOrigem: bankName, // DEPRECATED - manter para compatibilidade
          observacoes: tx.observacoes,
          confiancaClassificacao: tx.confianca_classificacao,
          idTransacao: hashId
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
      statementId: statement.id,
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
