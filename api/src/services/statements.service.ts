import { eq } from 'drizzle-orm'
import { statements, transactions } from '../schema/index.js'
import { generateHashId } from '../utils/hash.js'
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
    transacoes: any[]
  ): Promise<IngestResult> {
    const db = this.fastify.db

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
      
      try {
        await db.insert(transactions).values({
          statementId: statement.id,
          data: tx.data,
          descricaoOriginal: tx.descricao_original,
          estabelecimento: tx.estabelecimento,
          cnpj: tx.cnpj,
          tipo: tx.tipo,
          valor: tx.valor,
          categoria: tx.categoria,
          subcategoria: tx.subcategoria,
          meioPagamento: tx.meio_pagamento,
          bancoOrigem: tx.banco_origem,
          bancoDestino: tx.banco_destino,
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

  async getStatement(statementId: number) {
    const db = this.fastify.db
    return await db.select().from(statements).where(eq(statements.id, statementId)).limit(1)
  }
}
