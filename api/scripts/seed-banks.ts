import { drizzle } from 'drizzle-orm/better-sqlite3'
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import Database from 'better-sqlite3'
import { Pool } from 'pg'
import { banks } from '../src/schema/banks'
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

const banksData = [
  {
    id: 1,
    code: 'CEF',
    name: 'Caixa Econômica Federal'
  },
  {
    id: 2,
    code: 'BBDC4',
    name: 'Bradesco'
  },
  {
    id: 3,
    code: 'ITUB4',
    name: 'Itaú Unibanco'
  },
  {
    id: 4,
    code: 'BBAS3',
    name: 'Banco do Brasil'
  },
  {
    id: 5,
    code: 'SANB11',
    name: 'Santander'
  },
  {
    id: 6,
    code: 'NU',
    name: 'Nubank'
  },
  {
    id: 7,
    code: 'BIDI11',
    name: 'Banco Inter'
  },
  {
    id: 8,
    code: 'C6',
    name: 'C6 Bank'
  },
  {
    id: 9,
    code: 'PAGS',
    name: 'PagBank'
  },
  {
    id: 10,
    code: 'MELI',
    name: 'Mercado Pago'
  },
  {
    id: 11,
    code: 'PICPAY',
    name: 'PicPay'
  }
]

async function seedBanks() {
  console.log('🏦 Iniciando seed de bancos...')
  
  try {
    // Inserir bancos (INSERT OR IGNORE para evitar duplicatas)
    for (const bank of banksData) {
      await db.insert(banks).values(bank).onConflictDoNothing()
    }
    
    console.log(`✅ Seed concluído! ${banksData.length} bancos inseridos.`)
    
    // Verificar quantos foram realmente inseridos
    const count = await db.select().from(banks)
    console.log(`📊 Total de bancos na tabela: ${count.length}`)
    
    // Listar bancos inseridos
    console.log('📋 Bancos disponíveis:')
    count.forEach(bank => {
      console.log(`  ${bank.id}: ${bank.name} (${bank.code})`)
    })
    
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

seedBanks()
