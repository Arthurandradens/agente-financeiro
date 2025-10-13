import { FastifyPluginAsync } from 'fastify'
import { TransactionsQuerySchema } from '../types/dto.js'
import { TransactionsService } from '../services/transactions.service.js'
import { HttpError } from '../utils/errors.js'

const transactionsRoute: FastifyPluginAsync = async (fastify) => {
  const transactionsService = new TransactionsService(fastify)

  fastify.get('/transactions', {
    config: { requireAuth: true },
    schema: {
      querystring: TransactionsQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: { type: 'object' }
            },
            page: { type: 'number' },
            pageSize: { type: 'number' },
            total: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const filters = request.query as any
      const result = await transactionsService.list(filters)
      return result
    } catch (error) {
      fastify.log.error(error)
      throw new HttpError(500, 'Erro ao buscar transações')
    }
  })
}

export default transactionsRoute
