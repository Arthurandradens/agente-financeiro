import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import Database from 'better-sqlite3'
import { Pool } from 'pg'
import * as schema from '../schema/index'

declare module 'fastify' {
  interface FastifyInstance {
    db: ReturnType<typeof drizzle>
  }
}

const dbPlugin: FastifyPluginAsync = async (fastify) => {
  const dbVendor = process.env.DB_VENDOR || 'sqlite'
  
  fastify.log.info(`Initializing database: ${dbVendor}`)
  
  if (dbVendor === 'sqlite') {
    // SQLite setup
    const sqlite = new Database('./data/app.db')
    const db = drizzle(sqlite, { schema })
    
    fastify.decorate('db', db)
    fastify.log.info('SQLite database initialized')
    
    fastify.addHook('onClose', async () => {
      sqlite.close()
    })
  } else if (dbVendor === 'postgresql') {
    // PostgreSQL setup
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    })
    
    const db = drizzlePg(pool, { schema })
    fastify.decorate('db', db)
    
    fastify.addHook('onClose', async () => {
      await pool.end()
    })
  } else {
    throw new Error(`Unsupported DB_VENDOR: ${dbVendor}`)
  }
}

// Usar fastify-plugin para propagar o decorator para todos os contextos
export default fp(dbPlugin, {
  name: 'db-plugin'
})
