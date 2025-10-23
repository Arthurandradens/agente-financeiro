import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { config } from '../src/config/env'

async function runMigrations() {
  console.log('🔄 Running PostgreSQL migrations...')
  
  const pool = new Pool({
    connectionString: config.DATABASE_URL
  })
  const db = drizzle(pool)
  
  try {
    await migrate(db, { migrationsFolder: './drizzle' })
    console.log('✅ PostgreSQL migrations completed successfully')
  } catch (error) {
    console.error('❌ PostgreSQL migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigrations()
