import { FastifyPluginAsync } from 'fastify'
import { IngestSchema } from '../types/dto.js'
import { StatementsService } from '../services/statements.service.js'
import { HttpError } from '../utils/errors.js'

const statementsRoute: FastifyPluginAsync = async (fastify) => {
  const statementsService = new StatementsService(fastify)

  fastify.post('/statements/ingest', {
    config: { requireAuth: true },
    schema: {
      body: IngestSchema,
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

  fastify.get('/statements/:id', {
    config: { requireAuth: true }
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const statementId = parseInt(id)

    if (isNaN(statementId)) {
      throw new HttpError(400, 'ID do statement inválido')
    }

    const statement = await statementsService.getStatement(statementId)
    
    if (!statement || statement.length === 0) {
      throw new HttpError(404, 'Statement não encontrado')
    }

    return statement[0]
  })
}

export default statementsRoute
