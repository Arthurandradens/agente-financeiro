import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../schema/index";
import { config } from "../config/env";

declare module "fastify" {
  interface FastifyInstance {
    db: ReturnType<typeof drizzle>;
  }
}

const dbPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.log.info("Initializing PostgreSQL database");

  // PostgreSQL setup
  const pool = new Pool({
    connectionString: config.DATABASE_URL,
  });

  const db = drizzle(pool, { schema });
  fastify.decorate("db", db);
  fastify.log.info("PostgreSQL database initialized");

  fastify.addHook("onClose", async () => {
    await pool.end();
  });
};

// Usar fastify-plugin para propagar o decorator para todos os contextos
export default fp(dbPlugin, {
  name: "db-plugin",
});
