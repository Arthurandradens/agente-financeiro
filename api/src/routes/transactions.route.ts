import { FastifyPluginAsync } from 'fastify'
import { TransactionsQuerySchema } from '../types/dto'
import { TransactionsService } from '../services/transactions.service'
import { HttpError } from '../utils/errors'

const transactionsRoute: FastifyPluginAsync = async (fastify) => {
  const transactionsService = new TransactionsService(fastify)

  fastify.get('/', {
    config: { requireAuth: true },
    schema: {
      querystring: {
        type: 'object',
        properties: {
          userId: { type: 'number' },
          from: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          to: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          category: { type: 'string' },
          subcategory: { type: 'string' },
          type: { type: 'string' },
          paymentMethod: { type: 'string' },
          q: { type: 'string' },
          page: { type: 'string' },
          pageSize: { type: 'string' },
          sort: { type: 'string' }
        }
      },
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
