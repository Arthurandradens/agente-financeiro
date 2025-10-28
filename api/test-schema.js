import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { transactions } from './src/schema/index.js';

// Configuração do banco
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/agente_extrato';
const sql = postgres(connectionString);
const db = drizzle(sql);

async function testSchema() {
  try {
    console.log('Testando conexão com o banco...');
    
    // Teste simples - listar todas as colunas da tabela transactions
    const result = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      ORDER BY ordinal_position;
    `;
    
    console.log('Colunas da tabela transactions:');
    result.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Teste de query simples
    console.log('\nTestando query simples...');
    const simpleQuery = await db.select().from(transactions).limit(1);
    console.log('Query simples funcionou:', simpleQuery.length, 'registros');
    
  } catch (error) {
    console.error('Erro no teste:', error);
  } finally {
    await sql.end();
  }
}

testSchema();
