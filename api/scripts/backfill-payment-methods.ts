import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { transactions, paymentMethods } from '../src/schema'
import { eq, isNull, sql } from 'drizzle-orm'
import { config } from '../src/config/env'

const pool = new Pool({
  connectionString: config.DATABASE_URL
})
const db = drizzle(pool)

async function backfillPaymentMethods() {
  console.log('🔄 Iniciando backfill de payment methods...')
  
  try {
    // Verificar quantas transações precisam ser atualizadas
    const totalToUpdate = await db.select({ count: sql`count(*)` })
      .from(transactions)
      .where(isNull(transactions.paymentMethodId))
    
    console.log(`📊 Total de transações sem payment_method_id: ${totalToUpdate[0].count}`)
    
    if (totalToUpdate[0].count === 0) {
      console.log('✅ Todas as transações já possuem payment_method_id. Backfill desnecessário.')
      return
    }

    let updated = 0
    const stats = {
      pix: 0,
      cartaoCredito: 0,
      cartaoDebito: 0,
      boleto: 0,
      ted: 0,
      doc: 0,
      tef: 0,
      saque: 0,
      tarifa: 0,
      outro: 0
    }

    // 1. PIX
    const pixResult = await db.update(transactions)
      .set({ paymentMethodId: 1 })
      .where(sql`payment_method_id IS NULL AND (
        UPPER(meio_pagamento) LIKE '%PIX%' OR
        UPPER(descricao_original) LIKE '%PIX%'
      )`)
      .returning({ id: transactions.id })
    
    stats.pix = pixResult.length
    updated += pixResult.length
    console.log(`✅ PIX: ${pixResult.length} transações atualizadas`)

    // 2. Cartão Crédito (inclui pagamento de fatura)
    const cartaoCreditoResult = await db.update(transactions)
      .set({ paymentMethodId: 7 })
      .where(sql`payment_method_id IS NULL AND (
        UPPER(meio_pagamento) LIKE '%CREDITO%' OR
        LOWER(descricao_original) LIKE '%fatura cart%' OR
        is_card_bill_payment = 1
      )`)
      .returning({ id: transactions.id })
    
    stats.cartaoCredito = cartaoCreditoResult.length
    updated += cartaoCreditoResult.length
    console.log(`✅ Cartão Crédito: ${cartaoCreditoResult.length} transações atualizadas`)

    // 3. Cartão Débito
    const cartaoDebitoResult = await db.update(transactions)
      .set({ paymentMethodId: 6 })
      .where(sql`payment_method_id IS NULL AND (
        UPPER(meio_pagamento) LIKE '%DEBIT%' OR
        LOWER(descricao_original) LIKE '%debito%'
      )`)
      .returning({ id: transactions.id })
    
    stats.cartaoDebito = cartaoDebitoResult.length
    updated += cartaoDebitoResult.length
    console.log(`✅ Cartão Débito: ${cartaoDebitoResult.length} transações atualizadas`)

    // 4. Boleto
    const boletoResult = await db.update(transactions)
      .set({ paymentMethodId: 5 })
      .where(sql`payment_method_id IS NULL AND (
        UPPER(meio_pagamento) LIKE '%BOLETO%' OR
        LOWER(descricao_original) LIKE '%boleto%'
      )`)
      .returning({ id: transactions.id })
    
    stats.boleto = boletoResult.length
    updated += boletoResult.length
    console.log(`✅ Boleto: ${boletoResult.length} transações atualizadas`)

    // 5. TED
    const tedResult = await db.update(transactions)
      .set({ paymentMethodId: 2 })
      .where(sql`payment_method_id IS NULL AND UPPER(meio_pagamento) LIKE '%TED%'`)
      .returning({ id: transactions.id })
    
    stats.ted = tedResult.length
    updated += tedResult.length
    console.log(`✅ TED: ${tedResult.length} transações atualizadas`)

    // 6. DOC
    const docResult = await db.update(transactions)
      .set({ paymentMethodId: 3 })
      .where(sql`payment_method_id IS NULL AND UPPER(meio_pagamento) LIKE '%DOC%'`)
      .returning({ id: transactions.id })
    
    stats.doc = docResult.length
    updated += docResult.length
    console.log(`✅ DOC: ${docResult.length} transações atualizadas`)

    // 7. TEF (interna)
    const tefResult = await db.update(transactions)
      .set({ paymentMethodId: 4 })
      .where(sql`payment_method_id IS NULL AND (
        UPPER(meio_pagamento) LIKE '%TEF%' OR
        LOWER(descricao_original) LIKE '%entre contas%' OR
        is_internal_transfer = 1
      )`)
      .returning({ id: transactions.id })
    
    stats.tef = tefResult.length
    updated += tefResult.length
    console.log(`✅ TEF: ${tefResult.length} transações atualizadas`)

    // 8. Saque
    const saqueResult = await db.update(transactions)
      .set({ paymentMethodId: 8 })
      .where(sql`payment_method_id IS NULL AND (
        UPPER(meio_pagamento) LIKE '%SAQUE%' OR
        LOWER(descricao_original) LIKE '%saque%'
      )`)
      .returning({ id: transactions.id })
    
    stats.saque = saqueResult.length
    updated += saqueResult.length
    console.log(`✅ Saque: ${saqueResult.length} transações atualizadas`)

    // 9. Tarifa/Encargo
    const tarifaResult = await db.update(transactions)
      .set({ paymentMethodId: 9 })
      .where(sql`payment_method_id IS NULL AND (
        LOWER(categoria) LIKE '%tarifa%' OR
        LOWER(descricao_original) LIKE '%tarifa%' OR
        LOWER(descricao_original) LIKE '%anuidade%' OR
        LOWER(descricao_original) LIKE '%iof%' OR
        LOWER(descricao_original) LIKE '%juros%' OR
        LOWER(descricao_original) LIKE '%multa%'
      )`)
      .returning({ id: transactions.id })
    
    stats.tarifa = tarifaResult.length
    updated += tarifaResult.length
    console.log(`✅ Tarifa: ${tarifaResult.length} transações atualizadas`)

    // 10. Outro (fallback)
    const outroResult = await db.update(transactions)
      .set({ paymentMethodId: 99 })
      .where(isNull(transactions.paymentMethodId))
      .returning({ id: transactions.id })
    
    stats.outro = outroResult.length
    updated += outroResult.length
    console.log(`✅ Outro: ${outroResult.length} transações atualizadas`)

    console.log('\n📊 Resumo do Backfill:')
    console.log(`   PIX: ${stats.pix}`)
    console.log(`   Cartão Crédito: ${stats.cartaoCredito}`)
    console.log(`   Cartão Débito: ${stats.cartaoDebito}`)
    console.log(`   Boleto: ${stats.boleto}`)
    console.log(`   TED: ${stats.ted}`)
    console.log(`   DOC: ${stats.doc}`)
    console.log(`   TEF: ${stats.tef}`)
    console.log(`   Saque: ${stats.saque}`)
    console.log(`   Tarifa: ${stats.tarifa}`)
    console.log(`   Outro: ${stats.outro}`)
    console.log(`\n✅ Backfill concluído! ${updated} transações atualizadas.`)

  } catch (error) {
    console.error('❌ Erro no backfill:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

backfillPaymentMethods()
