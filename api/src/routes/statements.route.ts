import { FastifyPluginAsync } from 'fastify'
import { IngestSchema } from '../types/dto'
import { StatementsService } from '../services/statements.service'
import { HttpError } from '../utils/errors'

const statementsRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/statements/ingest', {
    config: { requireAuth: true },
    schema: {
      body: {
        type: 'object',
        required: ['userId', 'periodStart', 'periodEnd', 'sourceFile', 'transacoes'],
        properties: {
          userId: { type: 'number' },
          periodStart: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          periodEnd: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          sourceFile: { type: 'string' },
          transacoes: {
            type: 'array',
            items: {
              type: 'object',
              required: ['data', 'descricao_original', 'estabelecimento', 'tipo', 'valor', 'categoria'],
              properties: {
                data: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
                descricao_original: { type: 'string' },
                estabelecimento: { type: 'string' },
                cnpj: { type: 'string' },
                tipo: { type: 'string', enum: ['credito', 'debito'] },
                valor: { type: 'number' },
                categoria: { type: 'string' },
                subcategoria: { type: 'string' },
                meio_pagamento: { type: 'string' },
                banco_origem: { type: 'string' },
                banco_destino: { type: 'string' },
                observacoes: { type: 'string' },
                confianca_classificacao: { type: 'number', minimum: 0, maximum: 1 },
                id_transacao: { type: 'string' }
              }
            }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            statementId: { type: 'number' },
            inserted: { type: 'number' },
            duplicates: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { userId, periodStart, periodEnd, sourceFile, transacoes } = request.body

      const statementsService = new StatementsService(fastify)
      const result = await statementsService.ingestBatch(
        userId,
        periodStart,
        periodEnd,
        sourceFile,
        transacoes
      )

      return result
    } catch (error) {
      fastify.log.error(error)
      throw new HttpError(500, 'Erro ao processar ingest de transações')
    }
  })

  fastify.get('/:id', {
    config: { requireAuth: true }
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const statementId = parseInt(id)

    if (isNaN(statementId)) {
      throw new HttpError(400, 'ID do statement inválido')
    }

    const statementsService = new StatementsService(fastify)
    const statement = await statementsService.getStatement(statementId)
    
    if (!statement || statement.length === 0) {
      throw new HttpError(404, 'Statement não encontrado')
    }

    return statement[0]
  })
}

export default statementsRoute
