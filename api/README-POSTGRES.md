# Dashboard Financeiro API - PostgreSQL

Este projeto utiliza PostgreSQL como banco de dados principal.

## Configuração

### Variáveis de Ambiente

As seguintes variáveis de ambiente são usadas:

```bash
DB_VENDOR=postgresql
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finance_db
```

### Banco de Dados

- **Nome**: `finance_db`
- **Usuário**: `postgres`
- **Senha**: `postgres`
- **Host**: `localhost`
- **Porta**: `5432`

## Scripts Disponíveis

### Configuração Inicial

```bash
# Configurar o banco PostgreSQL
npm run setup:postgres

# Executar migrações
npm run db:push

# Popular dados iniciais
npm run seed:categories
npm run seed:payment-methods
npm run seed:banks
```

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Gerar novas migrações
npm run db:generate

# Executar migrações
npm run db:migrate
```

## Estrutura do Banco

O banco PostgreSQL possui as seguintes tabelas:

- `users` - Usuários do sistema
- `statements` - Extratos bancários
- `transactions` - Transações financeiras
- `categories` - Categorias de transações
- `payment_methods` - Métodos de pagamento
- `banks` - Bancos cadastrados

## Migração de Dados

Se você tiver dados em outros formatos que precisem ser migrados, use os scripts de ingestão da API:

```bash
# Ingerir dados via API
curl -X POST http://localhost:8080/statements/ingest \
  -H "Content-Type: application/json" \
  -H "X-API-Key: changeme" \
  -d @dados.json
```

## Troubleshooting

### Problema de Conexão

Verifique se o PostgreSQL está rodando:

```bash
psql -U postgres -c "SELECT version();"
```

### Problema de Permissões

Certifique-se de que o usuário `postgres` tem permissões adequadas:

```sql
GRANT ALL PRIVILEGES ON DATABASE finance_db TO postgres;
```

### Reset do Banco

Para limpar e recriar o banco:

```bash
# Deletar banco
psql -U postgres -c "DROP DATABASE IF EXISTS finance_db;"

# Recriar banco
npm run setup:postgres

# Executar setup completo
npm run setup:db
```
