import { FastifyPluginAsync } from 'fastify'
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
          bankId: { type: ['number', 'null'] },
          transacoes: {
            type: 'array',
            items: {
              type: 'object',
              required: ['date', 'description', 'amount', 'type', 'category_id', 'movement_kind', 'payment_method_id'],
              properties: {
                date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
                description: { type: 'string' },
                amount: { type: 'number' },
                type: { type: 'string', enum: ['income', 'spend'] },
                counterparty_normalized: { type: 'string' },
                payment_method: { type: 'string' },
                payment_method_id: { type: 'integer' },
                bank_id: { type: 'integer' },
                
                // IDs e labels
                category_id: { type: 'integer' },
                subcategory_id: { type: ['integer', 'null'] },
                category_label: { type: 'string' },
                subcategory_label: { type: ['string', 'null'] },
                movement_kind: { type: 'string', enum: ['spend', 'income', 'transfer', 'invest', 'fee'] },
                
                // Flags
                is_internal_transfer: { type: 'integer' },
                is_card_bill_payment: { type: 'integer' },
                is_investment_aporte: { type: 'integer' },
                is_investment_rendimento: { type: 'integer' }
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
  }, async (request, _reply) => {
    try {
      const { userId, periodStart, periodEnd, sourceFile, transacoes, bankId } = request.body as any

      const statementsService = new StatementsService(fastify)
      const result = await statementsService.ingestBatch(
        userId,
        periodStart,
        periodEnd,
        sourceFile,
        transacoes,
        bankId
      )

      return result
    } catch (error) {
      fastify.log.error(error)
      throw new HttpError(500, 'Erro ao processar ingest de transações')
    }
  })

  fastify.get('/:id', {
    config: { requireAuth: true }
  }, async (request, _reply) => {
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
