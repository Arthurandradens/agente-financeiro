import { describe, it, expect, beforeEach } from 'vitest'
import { createApp } from '../src/app.js'

describe('Dashboard endpoints', () => {
  let app: any

  beforeEach(async () => {
    app = await createApp()
    
    // Inserir dados de teste
    const transacoes = [
      {
        data: '2025-01-01',
        descricao_original: 'Transferência interna',
        estabelecimento: 'Internal Transfer',
        tipo: 'debito',
        valor: -100.00,
        categoria: 'Transferências',
        subcategoria: 'Transferência interna',
        observacoes: 'transferência interna'
      },
      {
        data: '2025-01-01',
        descricao_original: 'Pagamento fatura cartão',
        estabelecimento: 'Credit Card',
        tipo: 'debito',
        valor: -500.00,
        categoria: 'Cartão de Crédito',
        subcategoria: 'Pagamento de fatura'
      },
      {
        data: '2025-01-01',
        descricao_original: 'Compra supermercado',
        estabelecimento: 'Supermarket',
        tipo: 'debito',
        valor: -80.00,
        categoria: 'Alimentação',
        subcategoria: 'Supermercado'
      },
      {
        data: '2025-01-01',
        descricao_original: 'Salário',
        estabelecimento: 'Company',
        tipo: 'credito',
        valor: 3000.00,
        categoria: 'Renda',
        subcategoria: 'Salário'
      }
    ]

    await app.inject({
      method: 'POST',
      url: '/statements/ingest',
      headers: {
        'x-api-key': 'changeme'
      },
      payload: {
        userId: 1,
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31',
        sourceFile: 'test.csv',
        transacoes
      }
    })
  })

  it('should apply exclusions in overview', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/dash/overview?userId=1&from=2025-01-01&to=2025-01-31',
      headers: {
        'x-api-key': 'changeme'
      }
    })

    expect(response.statusCode).toBe(200)
    const result = JSON.parse(response.body)
    
    // Deve excluir transferência interna e pagamento de fatura
    // Apenas supermercado (80) e salário (3000) devem ser contados
    expect(result.totalSaidas).toBe(80) // Apenas supermercado
    expect(result.totalEntradas).toBe(3000) // Apenas salário
    expect(result.saldoFinalEstimado).toBe(2920) // 3000 - 80
  })

  it('should return category breakdown', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/dash/by-category?userId=1&from=2025-01-01&to=2025-01-31',
      headers: {
        'x-api-key': 'changeme'
      }
    })

    expect(response.statusCode).toBe(200)
    const result = JSON.parse(response.body)
    
    // Deve ter apenas as categorias não excluídas
    const categories = result.map((r: any) => r.categoria)
    expect(categories).toContain('Alimentação')
    expect(categories).toContain('Renda')
    expect(categories).not.toContain('Transferências')
    expect(categories).not.toContain('Cartão de Crédito')
  })

  it('should return time series data', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/dash/series?userId=1&from=2025-01-01&to=2025-01-31&groupBy=day',
      headers: {
        'x-api-key': 'changeme'
      }
    })

    expect(response.statusCode).toBe(200)
    const result = JSON.parse(response.body)
    
    expect(result.seriesEntradas).toBeDefined()
    expect(result.seriesSaidas).toBeDefined()
    expect(Array.isArray(result.seriesEntradas)).toBe(true)
    expect(Array.isArray(result.seriesSaidas)).toBe(true)
  })
})
