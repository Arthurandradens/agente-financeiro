import { FastifyPluginAsync } from 'fastify'

const healthRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', {
    config: { requireAuth: false }
  }, async (request, reply) => {
    return { ok: true }
  })
}

export default healthRoute
