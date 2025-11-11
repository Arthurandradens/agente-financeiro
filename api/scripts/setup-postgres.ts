import { Pool } from "pg";
import { config } from "../src/config/env";

async function setupPostgres() {
  console.log("🐘 Configurando PostgreSQL...");

  // Conectar ao banco postgres (banco padrão) para criar o finance_db
  const adminPool = new Pool({
    connectionString: "postgresql://postgres:postgres@localhost:5432/postgres",
  });

  try {
    // Verificar se o banco já existe
    const result = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = 'finance_db'",
    );

    if (result.rows.length === 0) {
      console.log("📦 Criando banco finance_db...");
      await adminPool.query("CREATE DATABASE finance_db");
      console.log("✅ Banco finance_db criado com sucesso!");
    } else {
      console.log("✅ Banco finance_db já existe");
    }

    // Conectar ao banco finance_db para verificar
    const financePool = new Pool({
      connectionString: config.DATABASE_URL,
    });

    const testResult = await financePool.query("SELECT version()");
    console.log("🔗 Conexão com finance_db estabelecida");
    console.log(`📊 Versão do PostgreSQL: ${testResult.rows[0].version}`);

    await financePool.end();
  } catch (error) {
    console.error("❌ Erro ao configurar PostgreSQL:", error);
    process.exit(1);
  } finally {
    await adminPool.end();
  }
}

setupPostgres();
