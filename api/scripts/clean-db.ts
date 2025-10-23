import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { transactions, statements, users } from '../src/schema/index.js'
import { config } from '../src/config/env'

async function cleanDatabase() {
  console.log('🧹 Limpando banco de dados PostgreSQL...')
  
  const pool = new Pool({
    connectionString: config.DATABASE_URL
  })
  const db = drizzle(pool)
  
  try {
    // Deletar em ordem (respeitando foreign keys)
    console.log('🗑️  Removendo transações...')
    await db.delete(transactions)
    
    console.log('🗑️  Removendo statements...')
    await db.delete(statements)
    
    console.log('🗑️  Removendo usuários...')
    await db.delete(users)
    
    console.log('✅ Banco de dados PostgreSQL limpo com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro ao limpar banco:', error)
  } finally {
    await pool.end()
  }
}

cleanDatabase()
