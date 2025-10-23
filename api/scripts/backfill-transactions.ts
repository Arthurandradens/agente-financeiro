import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { categories, transactions } from '../src/schema/index'
import { eq, and, sql } from 'drizzle-orm'
import { config } from '../src/config/env'

// Conectar ao banco PostgreSQL
const pool = new Pool({
  connectionString: config.DATABASE_URL
})
const db = drizzle(pool)

// Função para calcular flags de transação
function calculateFlags(tx: any) {
  const categoria = (tx.categoria || '').toLowerCase()
  const subcategoria = (tx.subcategoria || '').toLowerCase()
  const observacoes = (tx.observacoes || '').toLowerCase()
  const descricaoOriginal = (tx.descricaoOriginal || '').toLowerCase()
  
  const isInternalTransfer = 
    categoria.includes('transferência interna') || 
    categoria.includes('transferencia interna') ||
    observacoes.includes('transferência interna') ||
    observacoes.includes('transferencia interna')
  
  const isCardBillPayment = 
    categoria.includes('cartão de crédito') || 
    categoria.includes('cartao de credito') ||
    categoria.includes('cartão') ||
    categoria.includes('cartao') &&
    (subcategoria.includes('pagamento de fatura') || 
     subcategoria.includes('pagamento') ||
     subcategoria.includes('fatura'))
  
  const isInvestment = 
    categoria.includes('investimento') || 
    categoria.includes('investimentos') ||
    categoria.includes('aporte') ||
    categoria.includes('aplicação') ||
    categoria.includes('aplicacao')
  
  const isRefundOrChargeback = 
    descricaoOriginal.includes('estorno') ||
    descricaoOriginal.includes('chargeback') ||
    descricaoOriginal.includes('devolução') ||
    descricaoOriginal.includes('devolucao') ||
    observacoes.includes('estorno') ||
    observacoes.includes('chargeback') ||
    observacoes.includes('devolução') ||
    observacoes.includes('devolucao')
  
  return {
    isInternalTransfer: isInternalTransfer ? 1 : 0,
    isCardBillPayment: isCardBillPayment ? 1 : 0,
    isInvestment: isInvestment ? 1 : 0,
    isRefundOrChargeback: isRefundOrChargeback ? 1 : 0
  }
}

// Função para buscar ID da categoria por nome
async function findCategoryId(categoryName: string): Promise<number | null> {
  if (!categoryName) return null
  
  const results = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.name, categoryName))
    .limit(1)
  
  return results.length > 0 ? results[0].id : null
}

// Função para buscar ID da subcategoria por nome e categoria pai
async function findSubcategoryId(subcategoryName: string, categoryId: number): Promise<number | null> {
  if (!subcategoryName || !categoryId) return null
  
  const results = await db
    .select({ id: categories.id })
    .from(categories)
    .where(
      and(
        eq(categories.name, subcategoryName),
        eq(categories.parentId, categoryId)
      )
    )
    .limit(1)
  
  return results.length > 0 ? results[0].id : null
}

async function backfillTransactions() {
  console.log('🔄 Iniciando backfill de transações...')
  
  try {
    // Buscar todas as transações que ainda não foram processadas
    const unprocessedTransactions = await db
      .select()
      .from(transactions)
      .where(
        sql`${transactions.categoryId} IS NULL OR ${transactions.isInternalTransfer} IS NULL`
      )
    
    console.log(`📊 Encontradas ${unprocessedTransactions.length} transações para processar`)
    
    let processed = 0
    let errors = 0
    
    for (const tx of unprocessedTransactions) {
      try {
        // Buscar categoryId
        const categoryId = await findCategoryId(tx.categoria)
        
        // Buscar subcategoryId se existir
        let subcategoryId = null
        if (tx.subcategoria && categoryId) {
          subcategoryId = await findSubcategoryId(tx.subcategoria, categoryId)
        }
        
        // Calcular flags
        const flags = calculateFlags(tx)
        
        // Atualizar transação
        await db
          .update(transactions)
          .set({
            categoryId,
            subcategoryId,
            isInternalTransfer: flags.isInternalTransfer,
            isCardBillPayment: flags.isCardBillPayment,
            isInvestment: flags.isInvestment,
            isRefundOrChargeback: flags.isRefundOrChargeback
          })
          .where(eq(transactions.id, tx.id))
        
        processed++
        
        if (processed % 100 === 0) {
          console.log(`📈 Processadas ${processed}/${unprocessedTransactions.length} transações`)
        }
        
      } catch (error) {
        errors++
        console.error(`❌ Erro ao processar transação ID ${tx.id}:`, error)
        
        // Continuar com as próximas transações mesmo se uma falhar
        if (errors > 10) {
          console.error('❌ Muitos erros, parando o processamento')
          break
        }
      }
    }
    
    console.log(`✅ Backfill concluído!`)
    console.log(`📊 Processadas: ${processed}`)
    console.log(`❌ Erros: ${errors}`)
    
    // Estatísticas finais
    const stats = await db
      .select({
        total: sql<number>`COUNT(*)`,
        withCategoryId: sql<number>`COUNT(CASE WHEN ${transactions.categoryId} IS NOT NULL THEN 1 END)`,
        withFlags: sql<number>`COUNT(CASE WHEN ${transactions.isInternalTransfer} IS NOT NULL THEN 1 END)`
      })
      .from(transactions)
    
    console.log(`📈 Estatísticas finais:`)
    console.log(`   Total de transações: ${stats[0].total}`)
    console.log(`   Com categoryId: ${stats[0].withCategoryId}`)
    console.log(`   Com flags: ${stats[0].withFlags}`)
    
  } catch (error) {
    console.error('❌ Erro durante backfill:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Executar se chamado diretamente
if (process.argv[1] && process.argv[1].includes('backfill-transactions.ts')) {
  backfillTransactions()
    .then(() => {
      console.log('✅ Script finalizado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Erro:', error)
      process.exit(1)
    })
}

export { backfillTransactions }
