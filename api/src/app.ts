import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { config } from "./config/env";
import dbPlugin from "./plugins/db";
import authPlugin from "./plugins/auth";
import { createErrorHandler } from "./utils/errors";

// Import routes
import healthRoute from "./routes/health.route";
import statementsRoute from "./routes/statements.route";
import transactionsRoute from "./routes/transactions.route";
import dashboardRoute from "./routes/dashboard.route";
import categoriesRoute from "./routes/categories.route";
import paymentMethodsRoute from "./routes/payment-methods.route";

export async function createApp() {
  const fastify = Fastify({
    logger: {
      level: config.LOG_LEVEL,
    },
  });

  // CORS
  await fastify.register(cors, {
    origin: config.FRONTEND_ORIGIN,
    credentials: true,
  });

  // Multipart (para upload de arquivos)
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  });

  // Swagger (opcional)
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: "Dashboard Financeiro API",
        description: "API para ingestão e consulta de transações bancárias",
        version: "1.0.0",
      },
      host: `localhost:${config.PORT}`,
      schemes: ["http"],
      consumes: ["application/json"],
      produces: ["application/json"],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "full",
      deepLinking: false,
    },
  });

  // Plugins
  await fastify.register(dbPlugin);
  await fastify.register(authPlugin);

  // Error handler
  fastify.setErrorHandler(createErrorHandler());

  // Routes
  await fastify.register(healthRoute);
  await fastify.register(statementsRoute);
  await fastify.register(transactionsRoute);
  await fastify.register(dashboardRoute, { prefix: "/dash" });
  await fastify.register(categoriesRoute);
  await fastify.register(paymentMethodsRoute);

  return fastify;
}
