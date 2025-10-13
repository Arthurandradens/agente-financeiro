# Dashboard Financeiro API

Backend Fastify para ingestão e consulta de transações bancárias categorizadas.

## Stack

- **Runtime**: Node 20+
- **Server**: Fastify
- **ORM**: Drizzle ORM
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Validation**: Zod
- **Auth**: API Key simples
- **Testing**: Vitest

## Setup

### 1. Instalar dependências

```bash
cd api
npm install
```

### 2. Configurar ambiente

```bash
cp .env.example .env
# Editar .env com suas configurações
```

### 3. Configurar banco de dados

```bash
# Criar diretório para SQLite
mkdir -p data

# Gerar e aplicar migrações
npm run db:push
```

### 4. Executar

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## Endpoints

### Health
- `GET /health` - Status da API

### Statements
- `POST /statements/ingest` - Ingestão de transações (requer API key)
- `GET /statements/:id` - Buscar statement por ID

### Transactions
- `GET /transactions` - Listar transações com filtros

### Dashboard
- `GET /dash/overview` - KPIs gerais
- `GET /dash/by-category` - Agrupamento por categoria
- `GET /dash/series` - Séries temporais

## Variáveis de Ambiente

```env
PORT=8080
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173
API_KEY=changeme
DB_VENDOR=sqlite
DATABASE_URL=
LOG_LEVEL=info
```

## Docker

```bash
# Desenvolvimento
docker-compose up

# Produção
docker build -t dashboard-api .
docker run -p 8080:8080 dashboard-api
```

## Testes

```bash
npm test
```

## Integração com Classificador

O script `classificar_extrato.js` foi modificado para enviar dados automaticamente para a API após gerar o Excel.

Configure as variáveis:
- `API_BASE_URL` - URL da API (default: http://localhost:8080)
- `API_KEY` - Chave de autenticação

## Migração SQLite → PostgreSQL

1. Alterar `DB_VENDOR=postgres` no `.env`
2. Configurar `DATABASE_URL` com string de conexão
3. Executar `npm run db:push`

## Documentação

Acesse `/docs` para ver a documentação Swagger da API.
