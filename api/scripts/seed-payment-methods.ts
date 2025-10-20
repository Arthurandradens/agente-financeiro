import { drizzle } from 'drizzle-orm/better-sqlite3'
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import Database from 'better-sqlite3'
import { Pool } from 'pg'
import { paymentMethods } from '../src/schema/payment-methods'
import { config } from '../src/config/env'

// Configurar conexão com banco
let db: any
let pool: Pool | null = null

if (config.DB_VENDOR === 'sqlite') {
  const sqlite = new Database('./data/app.db')
  db = drizzle(sqlite)
} else if (config.DB_VENDOR === 'postgresql') {
  pool = new Pool({
    connectionString: config.DATABASE_URL
  })
  db = drizzlePg(pool)
} else {
  throw new Error(`Unsupported DB_VENDOR: ${config.DB_VENDOR}`)
}

const paymentMethodsData = [
  {
    id: 1,
    code: 'PIX',
    label: 'Pix',
    aliases: JSON.stringify(['PIX', 'QR PIX', 'QRPIX', 'CHAVE PIX'])
  },
  {
    id: 2,
    code: 'TED',
    label: 'TED',
    aliases: JSON.stringify(['TED', 'TRANSFERENCIA TED'])
  },
  {
    id: 3,
    code: 'DOC',
    label: 'DOC',
    aliases: JSON.stringify(['DOC', 'TRANSFERENCIA DOC'])
  },
  {
    id: 4,
    code: 'TEF',
    label: 'TEF Interna',
    aliases: JSON.stringify(['TEF', 'ENTRE CONTAS', 'INTRA', 'INTRABANCARIA'])
  },
  {
    id: 5,
    code: 'BOLETO',
    label: 'Boleto',
    aliases: JSON.stringify(['BOLETO', 'PAGAMENTO BOLETO'])
  },
  {
    id: 6,
    code: 'CARTAO_DEBITO',
    label: 'Cartão Débito',
    aliases: JSON.stringify(['DEBITO', 'CARTAO DEBITO', 'COMPRA DEB'])
  },
  {
    id: 7,
    code: 'CARTAO_CREDITO',
    label: 'Cartão Crédito',
    aliases: JSON.stringify(['CREDITO', 'CARTAO CREDITO', 'COMPRA CRED', 'FATURA CARTAO'])
  },
  {
    id: 8,
    code: 'SAQUE',
    label: 'Saque',
    aliases: JSON.stringify(['SAQUE', 'ATM', 'CAIXA ELETRONICO'])
  },
  {
    id: 9,
    code: 'TARIFA',
    label: 'Tarifa/Encargo',
    aliases: JSON.stringify(['TARIFA', 'ANUIDADE', 'IOF', 'JUROS', 'MULTA', 'PACOTE SERVICOS'])
  },
  {
    id: 99,
    code: 'OUTRO',
    label: 'Outro',
    aliases: JSON.stringify(['OUTRO', 'NA', 'DESCONHECIDO'])
  }
]

async function seedPaymentMethods() {
  console.log('🌱 Iniciando seed de payment methods...')
  
  try {
    // Inserir payment methods (INSERT OR IGNORE para evitar duplicatas)
    for (const pm of paymentMethodsData) {
      await db.insert(paymentMethods).values(pm).onConflictDoNothing()
    }
    
    console.log(`✅ Seed concluído! ${paymentMethodsData.length} payment methods inseridos.`)
    
    // Verificar quantos foram realmente inseridos
    const count = await db.select().from(paymentMethods)
    console.log(`📊 Total de payment methods na tabela: ${count.length}`)
    
  } catch (error) {
    console.error('❌ Erro no seed:', error)
    process.exit(1)
  } finally {
    if (config.DB_VENDOR === 'sqlite') {
      // SQLite não precisa fechar explicitamente aqui
    } else if (config.DB_VENDOR === 'postgresql' && pool) {
      await pool.end()
    }
  }
}

seedPaymentMethods()
