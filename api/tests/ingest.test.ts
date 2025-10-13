import { describe, it, expect, beforeEach } from 'vitest'
import { createApp } from '../src/app.js'

describe('Statements ingest', () => {
  let app: any

  beforeEach(async () => {
    app = await createApp()
  })

  it('should ingest transactions and handle duplicates', async () => {
    const transacoes = [
      {
        data: '2025-01-01',
        descricao_original: 'Test transaction 1',
        estabelecimento: 'Test Store',
        cnpj: '12.345.678/0001-90',
        tipo: 'debito',
        valor: -50.00,
        categoria: 'Test',
        subcategoria: 'Test Sub',
        meio_pagamento: 'PIX',
        banco_origem: 'Test Bank',
        banco_destino: 'Test Store',
        observacoes: 'Test note',
        confianca_classificacao: 0.95,
        id_transacao: 'test-123'
      }
    ]

    const payload = {
      userId: 1,
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      sourceFile: 'test.csv',
      transacoes
    }

    // Primeira inserção
    const response1 = await app.inject({
      method: 'POST',
      url: '/statements/ingest',
      headers: {
        'x-api-key': 'changeme'
      },
      payload
    })

    expect(response1.statusCode).toBe(200)
    const result1 = JSON.parse(response1.body)
    expect(result1.inserted).toBe(1)
    expect(result1.duplicates).toBe(0)

    // Segunda inserção (deve ser duplicada)
    const response2 = await app.inject({
      method: 'POST',
      url: '/statements/ingest',
      headers: {
        'x-api-key': 'changeme'
      },
      payload
    })

    expect(response2.statusCode).toBe(200)
    const result2 = JSON.parse(response2.body)
    expect(result2.inserted).toBe(0)
    expect(result2.duplicates).toBe(1)
  })
})
