import { drizzle } from 'drizzle-orm/better-sqlite3'
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import Database from 'better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { config } from '../src/config/env'

async function runMigrations() {
  console.log('🔄 Running database migrations...')
  
  if (config.DB_VENDOR === 'sqlite') {
    const sqlite = new Database('./data/app.db')
    const db = drizzle(sqlite)
    
    try {
      await migrate(db, { migrationsFolder: './drizzle' })
      console.log('✅ Migrations completed successfully')
    } catch (error) {
      console.error('❌ Migration failed:', error)
      process.exit(1)
    } finally {
      sqlite.close()
    }
  } else if (config.DB_VENDOR === 'postgresql') {
    const pool = new Pool({
      connectionString: config.DATABASE_URL
    })
    const db = drizzlePg(pool)
    
    try {
      await migratePg(db, { migrationsFolder: './drizzle' })
      console.log('✅ PostgreSQL migrations completed successfully')
    } catch (error) {
      console.error('❌ PostgreSQL migration failed:', error)
      process.exit(1)
    } finally {
      await pool.end()
    }
  } else {
    console.log('⚠️  Unsupported database vendor:', config.DB_VENDOR)
    process.exit(1)
  }
}

runMigrations()
