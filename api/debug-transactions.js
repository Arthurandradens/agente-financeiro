import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';

// Configuração do banco
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/agente_extrato';
const sql = postgres(connectionString);
const db = drizzle(sql);

async function debugTransactions() {
  try {
    console.log('Testando conexão com o banco...');
    
    // Verificar se a tabela transactions existe e suas colunas
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      ORDER BY ordinal_position;
    `;
    
    console.log('Colunas da tabela transactions:');
    tableInfo.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Teste de query simples usando SQL direto
    console.log('\nTestando query SQL direta...');
    const directQuery = await sql`
      SELECT id, date, description, type, amount 
      FROM transactions 
      LIMIT 1;
    `;
    console.log('Query direta funcionou:', directQuery.length, 'registros');
    console.log('Primeiro registro:', directQuery[0]);
    
  } catch (error) {
    console.error('Erro no debug:', error);
  } finally {
    await sql.end();
  }
}

debugTransactions();
