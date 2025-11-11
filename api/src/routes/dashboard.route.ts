import { FastifyPluginAsync } from "fastify";
import { DashQuerySchema } from "../types/dto";
import { DashboardService } from "../services/dashboard.service";
import { HttpError } from "../utils/errors";

const dashboardRoute: FastifyPluginAsync = async (fastify) => {
  const dashboardService = new DashboardService(fastify);

  fastify.get(
    "/overview",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            userId: { type: "number" },
            from: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
            to: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },

            // Filtros por STRING (manter compatibilidade)
            categories: { type: "string" },
            subcategories: { type: "string" },
            paymentMethods: { type: "string" },

            // Filtros por ID (NOVO - preferencial)
            categoryIds: { type: "string" },
            subcategoryIds: { type: "string" },
            paymentMethodIds: { type: "string" },

            // Busca textual
            q: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              totalEntradas: { type: "number" },
              totalSaidas: { type: "number" },
              saldoFinalEstimado: { type: "number" },
              tarifas: { type: "number" },
              investimentosAportes: { type: "number" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const filters = request.query as any;
        const result = await dashboardService.overview(filters);
        return result;
      } catch (error) {
        fastify.log.error(error);
        throw new HttpError(500, "Erro ao buscar overview do dashboard");
      }
    },
  );

  fastify.get(
    "/by-category",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            userId: { type: "number" },
            from: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
            to: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },

            // Filtros por STRING (manter compatibilidade)
            categories: { type: "string" },
            subcategories: { type: "string" },
            paymentMethods: { type: "string" },

            // Filtros por ID (NOVO - preferencial)
            categoryIds: { type: "string" },
            subcategoryIds: { type: "string" },
            paymentMethodIds: { type: "string" },

            // Busca textual
            q: { type: "string" },
          },
        },
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                categoria: { type: "string" },
                subcategoria: { type: "string" },
                qty: { type: "number" },
                total: { type: "number" },
                ticketMedio: { type: "number" },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const filters = request.query as any;
        const result = await dashboardService.byCategory(filters);
        return result;
      } catch (error) {
        fastify.log.error(error);
        throw new HttpError(500, "Erro ao buscar dados por categoria");
      }
    },
  );

  fastify.get(
    "/series",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            userId: { type: "number" },
            from: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
            to: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
            groupBy: { type: "string", enum: ["day", "week", "month"] },

            // Filtros por STRING (manter compatibilidade)
            categories: { type: "string" },
            subcategories: { type: "string" },
            paymentMethods: { type: "string" },

            // Filtros por ID (NOVO - preferencial)
            categoryIds: { type: "string" },
            subcategoryIds: { type: "string" },
            paymentMethodIds: { type: "string" },

            // Busca textual
            q: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              seriesEntradas: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    x: { type: "string" },
                    y: { type: "number" },
                  },
                },
              },
              seriesSaidas: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    x: { type: "string" },
                    y: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const filters = request.query as any;
        const groupBy = (request.query as any).groupBy || "day";
        const result = await dashboardService.series(filters, groupBy);
        return result;
      } catch (error) {
        fastify.log.error(error);
        throw new HttpError(500, "Erro ao buscar séries do dashboard");
      }
    },
  );

  fastify.get(
    "/top-subcategories",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            userId: { type: "number" },
            from: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
            to: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },

            // Filtros por STRING (manter compatibilidade)
            categories: { type: "string" },
            subcategories: { type: "string" },
            paymentMethods: { type: "string" },

            // Filtros por ID (NOVO - preferencial)
            categoryIds: { type: "string" },
            subcategoryIds: { type: "string" },
            paymentMethodIds: { type: "string" },

            // Busca textual
            q: { type: "string" },
          },
        },
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                subcategoria: { type: "string" },
                categoria: { type: "string" },
                total: { type: "number" },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const filters = request.query as any;
        const result = await dashboardService.topSubcategories(filters);
        return result;
      } catch (error) {
        fastify.log.error(error);
        throw new HttpError(500, "Erro ao buscar top subcategorias");
      }
    },
  );
};

export default dashboardRoute;
