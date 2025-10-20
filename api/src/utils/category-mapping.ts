import { eq, and } from 'drizzle-orm'
import { categories } from '../schema/index'

// Função para calcular flags de transação
export function calculateTransactionFlags(tx: any) {
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
    (categoria.includes('cartão de crédito') || 
     categoria.includes('cartao de credito') ||
     categoria.includes('cartão') ||
     categoria.includes('cartao')) &&
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
export async function findCategoryId(db: any, categoryName: string): Promise<number | null> {
  if (!categoryName) return null
  
  const results = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.name, categoryName))
    .limit(1)
  
  return results.length > 0 ? results[0].id : null
}

// Função para buscar ID da subcategoria por nome e categoria pai
export async function findSubcategoryId(db: any, subcategoryName: string, categoryId: number): Promise<number | null> {
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

// Função principal para mapear categoria e calcular flags
export async function mapCategoryToIds(db: any, tx: any) {
  // Buscar categoryId
  const categoryId = await findCategoryId(db, tx.categoria)
  
  // Buscar subcategoryId se existir
  let subcategoryId = null
  if (tx.subcategoria && categoryId) {
    subcategoryId = await findSubcategoryId(db, tx.subcategoria, categoryId)
  }
  
  // Calcular flags
  const flags = calculateTransactionFlags(tx)
  
  return {
    categoryId,
    subcategoryId,
    ...flags
  }
}

