import { FastifyPluginAsync } from 'fastify'
import { TransactionsQuerySchema } from '../types/dto'
import { TransactionsService } from '../services/transactions.service'
import { HttpError } from '../utils/errors'

const transactionsRoute: FastifyPluginAsync = async (fastify) => {
  const transactionsService = new TransactionsService(fastify)

  fastify.get('/transactions', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          userId: { type: 'number' },
          from: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          to: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          
          // Filtros por STRING (compatibilidade)
          category: { type: 'string' },
          subcategory: { type: 'string' },
          
          // Filtros por ID (NOVO - preferencial)
          categoryIds: { type: 'string' },
          subcategoryIds: { type: 'string' },
          paymentMethodIds: { type: 'string' },
          
          // Filtros existentes
          categoryId: { type: 'number' },
          subcategoryId: { type: 'number' },
          type: { type: 'string', enum: ['credito', 'debito'] },
          paymentMethodId: { type: 'number' },
          paymentCode: { type: 'string' },
          q: { type: 'string' },
          includeTransfers: { type: 'boolean' },
          page: { type: 'number', minimum: 1, default: 1 },
          pageSize: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          sort: { type: 'string', enum: ['data', '-data', 'valor', '-valor', 'categoria', '-categoria', 'confianca_classificacao', '-confianca_classificacao'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  data: { type: 'string' },
                  descricaoOriginal: { type: 'string' },
                  estabelecimento: { type: 'string' },
                  tipo: { type: 'string' },
                  valor: { type: 'number' },
                  categoria: { type: 'string' },
                  subcategoria: { type: 'string' },
                  meioPagamento: { type: 'string' },
                  paymentMethodId: { type: ['number', 'null'] },
                  paymentCode: { type: ['string', 'null'] },
                  paymentLabel: { type: ['string', 'null'] },
                  confiancaClassificacao: { type: 'number' },
                  isInternalTransfer: { type: 'number' },
                  isCardBillPayment: { type: 'number' },
                  isInvestment: { type: 'number' }
                }
              }
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
      
      // Converter strings para números onde necessário
      if (filters.page) {
        const page = parseInt(filters.page)
        if (isNaN(page) || page < 1) {
          throw new HttpError(400, 'Parâmetro page deve ser um número positivo')
        }
        filters.page = page
      }
      
      if (filters.pageSize) {
        const pageSize = parseInt(filters.pageSize)
        if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
          throw new HttpError(400, 'Parâmetro pageSize deve ser um número entre 1 e 100')
        }
        filters.pageSize = pageSize
      }
      
      if (filters.categoryId) {
        const categoryId = parseInt(filters.categoryId)
        if (isNaN(categoryId)) {
          throw new HttpError(400, 'Parâmetro categoryId deve ser um número')
        }
        filters.categoryId = categoryId
      }
      
      if (filters.subcategoryId) {
        const subcategoryId = parseInt(filters.subcategoryId)
        if (isNaN(subcategoryId)) {
          throw new HttpError(400, 'Parâmetro subcategoryId deve ser um número')
        }
        filters.subcategoryId = subcategoryId
      }
      
      if (filters.paymentMethodId) {
        const paymentMethodId = parseInt(filters.paymentMethodId)
        if (isNaN(paymentMethodId)) {
          throw new HttpError(400, 'Parâmetro paymentMethodId deve ser um número')
        }
        filters.paymentMethodId = paymentMethodId
      }
      
      if (filters.includeTransfers !== undefined) {
        filters.includeTransfers = filters.includeTransfers === 'true'
      }
      
      const result = await transactionsService.list(filters)
      return result
    } catch (error) {
      fastify.log.error('Erro no endpoint /transactions:', error)
      if (error instanceof HttpError) {
        throw error
      }
      throw new HttpError(500, 'Erro interno ao buscar transações')
    }
  })
}

export default transactionsRoute
