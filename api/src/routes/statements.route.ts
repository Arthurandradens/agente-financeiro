import { FastifyPluginAsync } from 'fastify'
import { StatementsService } from '../services/statements.service'
import { ClassificationService } from '../services/classification.service'
import { HttpError } from '../utils/errors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const statementsRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/statements/ingest', {
    config: { requireAuth: true },
    schema: {
      body: {
        type: 'object',
        required: ['userId', 'periodStart', 'periodEnd', 'sourceFile', 'transacoes'],
        properties: {
          userId: { type: 'number' },
          periodStart: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          periodEnd: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          sourceFile: { type: 'string' },
          bankId: { type: ['number', 'null'] },
          transacoes: {
            type: 'array',
            items: {
              type: 'object',
              required: ['date', 'description', 'amount', 'type', 'category_id', 'movement_kind', 'payment_method_id'],
              properties: {
                date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
                description: { type: 'string' },
                amount: { type: 'number' },
                type: { type: 'string', enum: ['income', 'spend'] },
                counterparty_normalized: { type: 'string' },
                payment_method: { type: 'string' },
                payment_method_id: { type: 'integer' },
                bank_id: { type: 'integer' },
                
                // IDs e labels
                category_id: { type: 'integer' },
                subcategory_id: { type: ['integer', 'null'] },
                category_label: { type: 'string' },
                subcategory_label: { type: ['string', 'null'] },
                movement_kind: { type: 'string', enum: ['spend', 'income', 'transfer', 'invest', 'fee'] },
                
                // Flags
                is_internal_transfer: { type: 'integer' },
                is_card_bill_payment: { type: 'integer' },
                is_investment_aporte: { type: 'integer' },
                is_investment_rendimento: { type: 'integer' }
              }
            }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            statementId: { type: 'number' },
            inserted: { type: 'number' },
            duplicates: { type: 'number' }
          }
        }
      }
    }
  }, async (request, _reply) => {
    try {
      const { userId, periodStart, periodEnd, sourceFile, transacoes, bankId } = request.body as any

      const statementsService = new StatementsService(fastify)
      const result = await statementsService.ingestBatch(
        userId,
        periodStart,
        periodEnd,
        sourceFile,
        transacoes,
        bankId
      )

      return result
    } catch (error) {
      fastify.log.error(error)
      throw new HttpError(500, 'Erro ao processar ingest de transações')
    }
  })

  fastify.post('/statements/upload-csv', {
    config: { requireAuth: true }
  }, async (request, reply) => {
    try {
      const data = await request.file()
      
      if (!data) {
        throw new HttpError(400, 'Arquivo CSV não fornecido')
      }

      if (!data.filename || !data.filename.endsWith('.csv')) {
        throw new HttpError(400, 'Apenas arquivos CSV são aceitos')
      }

      // Ler conteúdo do arquivo
      const buffer = await data.toBuffer()
      const csvContent = buffer.toString('utf8')

      // Detectar formato e bank_id
      let bankId: number
      if (csvContent.includes('RELEASE_DATE;TRANSACTION_TYPE')) {
        bankId = 10 // Mercado Pago
      } else if (csvContent.includes('Data,Valor,Identificador,Descrição')) {
        bankId = 6 // Nubank
      } else if (csvContent.includes('Data;Histórico;Docto.;Crédito (R$);Débito (R$);Saldo (R$)')) {
        bankId = 2 // Bradesco
      } else {
        throw new HttpError(400, 'Formato de CSV não reconhecido. Formatos suportados: Mercado Pago, Nubank, Bradesco')
      }

      // Ler prompt do agente
      const __filename = fileURLToPath(import.meta.url)
      const __dirname = path.dirname(__filename)
      const promptPath = path.join(__dirname, '../../../prompt-agente.txt')
      const systemPrompt = fs.readFileSync(promptPath, 'utf8')

      // Classificar transações
      const classificationService = new ClassificationService()
      const classificados = await classificationService.classifyCSV(csvContent, systemPrompt, bankId)

      if (!classificados || classificados.length === 0) {
        throw new HttpError(400, 'Nenhuma transação classificada')
      }

      // Detectar período
      const dates = classificados.map(t => t.date).filter(Boolean) as string[]
      const periodStart = dates.length > 0 ? dates.sort()[0] : '2025-01-01'
      const periodEnd = dates.length > 0 ? dates.sort().reverse()[0] : '2025-01-31'

      // Salvar no banco
      const statementsService = new StatementsService(fastify)
      const userId = 1 // Fixo para MVP
      const result = await statementsService.ingestBatch(
        userId,
        periodStart,
        periodEnd,
        data.filename,
        classificados,
        bankId
      )

      return {
        ...result,
        totalClassified: classificados.length
      }
    } catch (error: any) {
      fastify.log.error(error)
      if (error instanceof HttpError) {
        throw error
      }
      throw new HttpError(500, error.message || 'Erro ao processar upload de CSV')
    }
  })

  fastify.get('/:id', {
    config: { requireAuth: true }
  }, async (request, _reply) => {
    const { id } = request.params as { id: string }
    const statementId = parseInt(id)

    if (isNaN(statementId)) {
      throw new HttpError(400, 'ID do statement inválido')
    }

    const statementsService = new StatementsService(fastify)
    const statement = await statementsService.getStatement(statementId)
    
    if (!statement || statement.length === 0) {
      throw new HttpError(404, 'Statement não encontrado')
    }

    return statement[0]
  })
}

export default statementsRoute
