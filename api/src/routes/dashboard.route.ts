import { FastifyPluginAsync } from 'fastify'
import { DashQuerySchema } from '../types/dto.js'
import { DashboardService } from '../services/dashboard.service.js'
import { HttpError } from '../utils/errors.js'

const dashboardRoute: FastifyPluginAsync = async (fastify) => {
  const dashboardService = new DashboardService(fastify)

  fastify.get('/dash/overview', {
    config: { requireAuth: true },
    schema: {
      querystring: DashQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            totalEntradas: { type: 'number' },
            totalSaidas: { type: 'number' },
            saldoFinalEstimado: { type: 'number' },
            tarifas: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const filters = request.query as any
      const result = await dashboardService.overview(filters)
      return result
    } catch (error) {
      fastify.log.error(error)
      throw new HttpError(500, 'Erro ao buscar overview do dashboard')
    }
  })

  fastify.get('/dash/by-category', {
    config: { requireAuth: true },
    schema: {
      querystring: DashQuerySchema,
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              categoria: { type: 'string' },
              subcategoria: { type: 'string' },
              qty: { type: 'number' },
              total: { type: 'number' },
              ticketMedio: { type: 'number' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const filters = request.query as any
      const result = await dashboardService.byCategory(filters)
      return result
    } catch (error) {
      fastify.log.error(error)
      throw new HttpError(500, 'Erro ao buscar dados por categoria')
    }
  })

  fastify.get('/dash/series', {
    config: { requireAuth: true },
    schema: {
      querystring: DashQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            seriesEntradas: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  x: { type: 'string' },
                  y: { type: 'number' }
                }
              }
            },
            seriesSaidas: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  x: { type: 'string' },
                  y: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const filters = request.query as any
      const groupBy = (request.query as any).groupBy || 'day'
      const result = await dashboardService.series(filters, groupBy)
      return result
    } catch (error) {
      fastify.log.error(error)
      throw new HttpError(500, 'Erro ao buscar séries do dashboard')
    }
  })
}

export default dashboardRoute
