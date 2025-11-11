import { FastifyPluginAsync } from "fastify";

const authPlugin: FastifyPluginAsync = async (fastify) => {
  // Se API_KEY não estiver definido, permite acesso (dev mode)
  if (!process.env.API_KEY) {
    fastify.log.warn("API_KEY not set, auth disabled (dev mode)");
    return;
  }

  fastify.addHook("onRequest", async (request, reply) => {
    // Verifica se a rota requer autenticação
    const routeOptions = request.routeOptions;
    if (routeOptions.config?.requireAuth === false) {
      return;
    }

    const apiKey = request.headers["x-api-key"] as string;

    if (!apiKey) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Missing x-api-key header",
      });
    }

    if (apiKey !== process.env.API_KEY) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Invalid API key",
      });
    }
  });
};

export default authPlugin;
