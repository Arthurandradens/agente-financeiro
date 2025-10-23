import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { config } from '../src/config/env'

// Conectar ao banco PostgreSQL
const pool = new Pool({
  connectionString: config.DATABASE_URL
})
const db = drizzle(pool)

async function createView() {
  console.log('🔍 Criando VIEW v_transactions_normalized...')
  
  try {
    // SQL para criar a VIEW
    const createViewSQL = `
      CREATE VIEW IF NOT EXISTS v_transactions_normalized AS
      SELECT
        t.*,
        c.name AS category_name,
        c.slug AS category_slug,
        c.kind AS category_kind,
        sc.name AS subcategory_name,
        sc.slug AS subcategory_slug,
        CASE
          WHEN t.tipo = 'debito'
           AND t.is_internal_transfer = 0
           AND t.is_card_bill_payment = 0
           AND t.is_investment = 0
          THEN ABS(t.valor)
          ELSE 0
        END AS expense_effective,
        CASE
          WHEN t.tipo = 'credito'
           AND t.is_internal_transfer = 0
          THEN t.valor
          ELSE 0
        END AS income_effective
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      LEFT JOIN categories sc ON sc.id = t.subcategory_id;
    `
    
    // Executar SQL
    sqlite.exec(createViewSQL)
    
    console.log('✅ VIEW v_transactions_normalized criada com sucesso!')
    
    // Testar a VIEW
    const testQuery = sqlite.prepare(`
      SELECT COUNT(*) as total,
             SUM(expense_effective) as total_expenses,
             SUM(income_effective) as total_income
      FROM v_transactions_normalized
    `).get()
    
    console.log('📊 Teste da VIEW:')
    console.log(`   Total de registros: ${testQuery.total}`)
    console.log(`   Total de gastos efetivos: ${testQuery.total_expenses}`)
    console.log(`   Total de entradas efetivas: ${testQuery.total_income}`)
    
  } catch (error) {
    console.error('❌ Erro ao criar VIEW:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Executar se chamado diretamente
if (process.argv[1] && process.argv[1].includes('create-view.ts')) {
  createView()
    .then(() => {
      console.log('✅ Script finalizado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Erro:', error)
      process.exit(1)
    })
}

export { createView }
