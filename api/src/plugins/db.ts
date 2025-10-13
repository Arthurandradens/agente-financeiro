import { FastifyPluginAsync } from 'fastify'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import Database from 'better-sqlite3'
import { Pool } from 'pg'
import * as schema from '../schema/index.js'

declare module 'fastify' {
  interface FastifyInstance {
    db: ReturnType<typeof drizzle>
  }
}

const dbPlugin: FastifyPluginAsync = async (fastify) => {
  const dbVendor = process.env.DB_VENDOR || 'sqlite'
  
  if (dbVendor === 'sqlite') {
    // SQLite setup
    const sqlite = new Database('./data/app.db')
    const db = drizzle(sqlite, { schema })
    
    fastify.decorate('db', db)
    
    fastify.addHook('onClose', async () => {
      sqlite.close()
    })
  } else if (dbVendor === 'postgres') {
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

export default dbPlugin
