import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { config } from '../src/config/env.js'

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
  } else {
    console.log('⚠️  PostgreSQL migrations not implemented yet')
    console.log('   Please run migrations manually for PostgreSQL')
  }
}

runMigrations()
