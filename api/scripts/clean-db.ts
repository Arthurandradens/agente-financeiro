import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { transactions, statements, users } from '../src/schema/index.js'

async function cleanDatabase() {
  console.log('🧹 Limpando banco de dados...')
  
  const sqlite = new Database('./data/app.db')
  const db = drizzle(sqlite)
  
  try {
    // Deletar em ordem (respeitando foreign keys)
    console.log('🗑️  Removendo transações...')
    await db.delete(transactions)
    
    console.log('🗑️  Removendo statements...')
    await db.delete(statements)
    
    console.log('🗑️  Removendo usuários...')
    await db.delete(users)
    
    console.log('✅ Banco de dados limpo com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro ao limpar banco:', error)
  } finally {
    sqlite.close()
  }
}

cleanDatabase()
