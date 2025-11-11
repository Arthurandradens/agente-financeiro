import { FastifyPluginAsync } from "fastify";
import { PaymentMethodsService } from "../services/payment-methods.service";

const paymentMethodsRoute: FastifyPluginAsync = async (fastify) => {
  const paymentMethodsService = new PaymentMethodsService(fastify);

  fastify.get(
    "/payment-methods",
    {
      schema: {
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                code: { type: "string" },
                label: { type: "string" },
                aliases: { type: ["string", "null"] },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const paymentMethods = await paymentMethodsService.list();
        return paymentMethods;
      } catch (error) {
        fastify.log.error(error);
        throw new Error("Erro ao buscar métodos de pagamento");
      }
    },
  );
};

export default paymentMethodsRoute;
