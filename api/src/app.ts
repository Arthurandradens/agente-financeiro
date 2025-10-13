import Fastify from 'fastify'
import cors from '@fastify/cors'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { config } from './config/env.js'
import dbPlugin from './plugins/db.js'
import authPlugin from './plugins/auth.js'
import { createErrorHandler } from './utils/errors.js'

// Import routes
import healthRoute from './routes/health.route.js'
import statementsRoute from './routes/statements.route.js'
import transactionsRoute from './routes/transactions.route.js'
import dashboardRoute from './routes/dashboard.route.js'

export async function createApp() {
  const fastify = Fastify({
    logger: {
      level: config.LOG_LEVEL
    }
  })

  // CORS
  await fastify.register(cors, {
    origin: config.FRONTEND_ORIGIN,
    credentials: true
  })

  // Swagger (opcional)
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'Dashboard Financeiro API',
        description: 'API para ingestão e consulta de transações bancárias',
        version: '1.0.0'
      },
      host: `localhost:${config.PORT}`,
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json']
    }
  })

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false
    }
  })

  // Plugins
  await fastify.register(dbPlugin)
  await fastify.register(authPlugin)

  // Error handler
  fastify.setErrorHandler(createErrorHandler())

  // Routes
  await fastify.register(healthRoute)
  await fastify.register(statementsRoute, { prefix: '/statements' })
  await fastify.register(transactionsRoute, { prefix: '/transactions' })
  await fastify.register(dashboardRoute, { prefix: '/dash' })

  return fastify
}
