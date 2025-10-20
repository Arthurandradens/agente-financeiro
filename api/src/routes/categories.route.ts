import { FastifyPluginAsync } from 'fastify'
import { CategoriesService } from '../services/categories.service'
import { HttpError } from '../utils/errors'

const categoriesRoute: FastifyPluginAsync = async (fastify) => {
  const categoriesService = new CategoriesService(fastify)

  fastify.get('/categories', {
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
                  name: { type: 'string' },
                  slug: { type: 'string' },
                  kind: { type: 'string' },
                  parentId: { type: 'number' }
                }
              }
            },
            total: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const result = await categoriesService.list()
      return result
    } catch (error) {
      fastify.log.error(error)
      throw new HttpError(500, 'Erro ao buscar categorias')
    }
  })

  fastify.get('/categories/hierarchy', {
    schema: {
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              slug: { type: 'string' },
              kind: { type: 'string' },
              parentId: { type: 'number' },
              children: {
                type: 'array',
                items: { type: 'object' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const result = await categoriesService.getHierarchy()
      return result
    } catch (error) {
      fastify.log.error(error)
      throw new HttpError(500, 'Erro ao buscar hierarquia de categorias')
    }
  })

  fastify.get('/categories/:id', {
    config: { requireAuth: true },
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            slug: { type: 'string' },
            kind: { type: 'string' },
            parentId: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: number }
      const result = await categoriesService.getById(id)
      
      if (!result) {
        throw new HttpError(404, 'Categoria não encontrada')
      }
      
      return result
    } catch (error) {
      fastify.log.error(error)
      if (error instanceof HttpError) throw error
      throw new HttpError(500, 'Erro ao buscar categoria')
    }
  })

  fastify.post('/categories', {
    config: { requireAuth: true },
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          slug: { type: 'string' },
          kind: { type: 'string', enum: ['spend', 'income', 'transfer', 'invest', 'fee'] },
          parentId: { type: 'number' }
        },
        required: ['name', 'slug', 'kind']
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            slug: { type: 'string' },
            kind: { type: 'string' },
            parentId: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const data = request.body as any
      const result = await categoriesService.create(data)
      
      reply.code(201)
      return result
    } catch (error) {
      fastify.log.error(error)
      if (error.message === 'Slug já existe') {
        throw new HttpError(409, error.message)
      }
      if (error.message === 'Categoria pai não encontrada') {
        throw new HttpError(400, error.message)
      }
      throw new HttpError(500, 'Erro ao criar categoria')
    }
  })

  fastify.patch('/categories/:id', {
    config: { requireAuth: true },
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          slug: { type: 'string' },
          kind: { type: 'string', enum: ['spend', 'income', 'transfer', 'invest', 'fee'] },
          parentId: { type: 'number' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            slug: { type: 'string' },
            kind: { type: 'string' },
            parentId: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: number }
      const data = request.body as any
      const result = await categoriesService.update(id, data)
      
      return result
    } catch (error) {
      fastify.log.error(error)
      if (error.message === 'Categoria não encontrada') {
        throw new HttpError(404, error.message)
      }
      if (error.message === 'Slug já existe') {
        throw new HttpError(409, error.message)
      }
      if (error.message === 'Categoria pai não encontrada') {
        throw new HttpError(400, error.message)
      }
      throw new HttpError(500, 'Erro ao atualizar categoria')
    }
  })

  fastify.delete('/categories/:id', {
    config: { requireAuth: true },
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: number }
      await categoriesService.delete(id)
      
      return { success: true }
    } catch (error) {
      fastify.log.error(error)
      if (error.message === 'Categoria não encontrada') {
        throw new HttpError(404, error.message)
      }
      if (error.message.includes('subcategorias') || error.message.includes('transações')) {
        throw new HttpError(400, error.message)
      }
      throw new HttpError(500, 'Erro ao excluir categoria')
    }
  })
}

export default categoriesRoute

