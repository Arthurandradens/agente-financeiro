import { FastifyPluginAsync } from 'fastify'
import { eq } from 'drizzle-orm'
import { TransactionsService } from '../services/transactions.service'
import { HttpError } from '../utils/errors'
import { transactions, banks } from '../schema/index'

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
          type: { type: 'string', enum: ['income', 'spend'] },
          paymentMethodId: { type: 'number' },
          paymentCode: { type: 'string' },
          q: { type: 'string' },
          includeTransfers: { type: 'boolean' },
          page: { type: 'number', minimum: 1, default: 1 },
          pageSize: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          sort: { type: 'string', enum: ['data', '-data', 'valor', '-valor', 'categoria', '-categoria'] }
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
                  date: { type: 'string' },
                  description: { type: 'string' },
                  merchant: { type: 'string' },
                  type: { type: 'string' },
                  amount: { type: 'number' },
                  category: { type: 'string' },
                  subcategory: { type: 'string' },
                  category_id: { type: ['number', 'null'] },
                  subcategory_id: { type: ['number', 'null'] },
                  payment_method: { type: 'string' },
                  payment_method_id: { type: ['number', 'null'] },
                  paymentCode: { type: ['string', 'null'] },
                  paymentLabel: { type: ['string', 'null'] },
                  bank_id: { type: ['number', 'null'] },
                  bank_name: { type: ['string', 'null'] },
                  bankCode: { type: ['string', 'null'] },
                  bankName: { type: ['string', 'null'] },
                  is_internal_transfer: { type: 'number' },
                  is_card_bill_payment: { type: 'number' },
                  is_investment: { type: 'number' }
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
  }, async (request) => {
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
      fastify.log.error('Erro no endpoint /transactions:')
      if (error instanceof HttpError) {
        throw error
      }
      throw new HttpError(500, 'Erro interno ao buscar transações')
    }
  })

  // POST /transactions - Criar nova transação
  fastify.post('/transactions', {
    schema: {
      body: {
        type: 'object',
        required: ['date', 'amount', 'type', 'category_id', 'payment_method_id', 'bank_id'],
        properties: {
          date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          amount: { type: 'number', minimum: 0 },
          type: { type: 'string', enum: ['income', 'spend'] },
          category_id: { type: 'number' },
          subcategory_id: { type: 'number' },
          payment_method_id: { type: 'number' },
          bank_id: { type: 'number' },
          description: { type: 'string' },
          merchant: { type: 'string' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            date: { type: 'string' },
            amount: { type: 'number' },
            type: { type: 'string' },
            category_id: { type: 'number' },
            subcategory_id: { type: 'number' },
            payment_method: { type: 'string' },
            bank_name: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      console.log('\n\n 📝 Recebendo transação: aaaaaaaaaaaaaaaaaaaaaaaa', request.body)
      const data = request.body as any
      
      // Criar statement temporário para a transação manual
      // const statementResult = await fastify.db.insert(statements).values({
        // userId: 1, // Usuário padrão
      //   periodStart: data.data,
      //   periodEnd: data.data,
      //   sourceFile: 'manual_entry'
      // }).returning({ id: statements.id })
      
      // const statementId = statementResult[0]?.id
      
      // Inserir transação
      console.log('\n\n 📝 Inserindo transação:', data)
      const transactionResult = await fastify.db.insert(transactions).values({
        date: data.date,
        description: data.description || 'Transação manual',
        merchant: data.merchant || null,
        type: data.type,
        amount: data.amount,
        category_id: data.category_id,
        subcategory_id: data.subcategory_id,
        payment_method_id: data.payment_method_id,
        bank_id: data.bank_id
      }).returning()
      
      const transaction = transactionResult[0]
      
      if (!transaction) {
        throw new HttpError(500, 'Erro ao criar transação')
      }
      
      return reply.code(201).send({
        id: transaction.id,
        date: transaction.date,
        amount: transaction.amount,
        type: transaction.type,
        payment_method: transaction.payment_method,
        bank_name: transaction.bank_name
      })
    } catch (error) {
      fastify.log.error('Erro ao criar transação:' + error)
      throw new HttpError(500, 'Erro interno ao criar transação')
    }
  })

  // PATCH /transactions/:id - Editar transação
  fastify.patch('/transactions/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        }
      },
      body: {
        type: 'object',
        properties: {
          date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          amount: { type: 'number', minimum: 0 },
          type: { type: 'string', enum: ['income', 'spend'] },
          category_id: { type: 'number' },
          subcategory_id: { type: 'number' },
          payment_method_id: { type: 'number' },
          bank_id: { type: 'number' },
          description: { type: 'string' },
          merchant: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            date: { type: 'string' },
            amount: { type: 'number' },
            type: { type: 'string' },
            category_id: { type: 'number' },
            subcategory_id: { type: 'number' },
            payment_method: { type: 'string' },
            bank_name: { type: 'string' }
          }
        }
      }
    }
  }, async (request) => {
    try {
      const { id } = request.params as { id: number }
      const data = request.body as any
      
      // Verificar se transação existe
      const existingTransaction = await fastify.db
        .select()
        .from(transactions)
        .where(eq(transactions.id, id))
        .limit(1)
      
      if (existingTransaction.length === 0) {
        throw new HttpError(404, 'Transação não encontrada')
      }
      
      // Atualizar transação
      const updateData: any = {}
      if (data.date !== undefined) updateData.date = data.date
      if (data.amount !== undefined) updateData.amount = data.amount
      if (data.type !== undefined) updateData.type = data.type
      if (data.category_id !== undefined) updateData.category_id = data.category_id
      if (data.subcategory_id !== null) updateData.subcategory_id = data.subcategory_id
      if (data.payment_method_id !== undefined) updateData.payment_method_id = data.payment_method_id
      if (data.bank_id !== undefined) updateData.bank_id = data.bank_id
      if (data.description !== undefined) updateData.description = data.description
      if (data.merchant !== undefined) updateData.merchant = data.merchant
      
      const updatedTransaction = await fastify.db
        .update(transactions)
        .set(updateData)
        .where(eq(transactions.id, id))
        .returning()
      
      if (!updatedTransaction[0]) {
        throw new HttpError(500, 'Erro ao atualizar transação')
      }
      
      return {
        id: updatedTransaction[0].id,
        date: updatedTransaction[0].date,
        amount: updatedTransaction[0].amount,
        type: updatedTransaction[0].type,
        category_id: updatedTransaction[0].category_id,
        subcategory_id: updatedTransaction[0].subcategory_id,
        payment_method: updatedTransaction[0].payment_method,
        bank_name: updatedTransaction[0].bank_name
      }
    } catch (error) {
      fastify.log.error('Erro ao editar transação:' + error.message)
      if (error instanceof HttpError) {
        throw error
      }
      throw new HttpError(500, 'Erro interno ao editar transação')
    }
  })

  // DELETE /transactions/:id - Excluir transação
  fastify.delete('/transactions/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request) => {
    try {
      const { id } = request.params as { id: number }
      
      // Verificar se transação existe
      const existingTransaction = await fastify.db
        .select()
        .from(transactions)
        .where(eq(transactions.id, id))
        .limit(1)
      
      if (existingTransaction.length === 0) {
        throw new HttpError(404, 'Transação não encontrada')
      }
      
      // Excluir transação
      await fastify.db
        .delete(transactions)
        .where(eq(transactions.id, id))
      
      return { message: 'Transação excluída com sucesso' }
    } catch (error) {
      fastify.log.error('Erro ao excluir transação:')
      if (error instanceof HttpError) {
        throw error
      }
      throw new HttpError(500, 'Erro interno ao excluir transação')
    }
  })

  // GET /banks - Listar bancos
  fastify.get('/banks', {
    schema: {
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
                  code: { type: 'string' },
                  name: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async () => {
    try {
      const banksList = await fastify.db.select().from(banks)
      return { items: banksList }
    } catch (error) {
      fastify.log.error('Erro ao listar bancos:')
      throw new HttpError(500, 'Erro interno ao listar bancos')
    }
  })
}

export default transactionsRoute
