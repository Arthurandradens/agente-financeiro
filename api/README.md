# Dashboard Financeiro API

Backend Fastify para ingestão e consulta de transações bancárias categorizadas com normalização de categorias e cálculos efetivos.

## Stack

- **Runtime**: Node 20+
- **Server**: Fastify
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL
- **Validation**: Zod
- **Auth**: API Key simples
- **Testing**: Vitest

## Novidades - Normalização de Categorias

### O que mudou

- **Categorias normalizadas**: Tabela `categories` com hierarquia (pai/filho)
- **Flags de transação**: Campos booleanos para identificar transferências internas, investimentos, etc.
- **VIEW otimizada**: `v_transactions_normalized` com cálculos de gasto/entrada efetivos
- **Exclusões automáticas**: Transferências internas e pagamentos de fatura não contam como gasto
- **Investimentos separados**: Aportes não contam como gasto, rendimentos contam como entrada

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
# Configurar PostgreSQL
npm run setup:postgres

# Gerar e aplicar migrações
npm run db:push

# Popular dados iniciais
npm run seed:categories
npm run seed:payment-methods
npm run seed:banks

# Preencher categoryId/subcategoryId e flags nas transações
npm run backfill:transactions
npm run backfill:payment-methods

# Criar VIEW para cálculos efetivos
npm run create:view

# Ou executar setup completo
npm run setup:db
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
- `GET /transactions` - Listar transações com filtros e paginação

### Dashboard
- `GET /dash/overview` - KPIs gerais (Entradas, Saídas, Saldo, Tarifas, Investimentos)
- `GET /dash/by-category` - Agrupamento por categoria para gráfico pizza/rosca
- `GET /dash/series` - Séries temporais para gráfico de evolução
- `GET /dash/top-subcategories` - Top 10 subcategorias para gráfico de barras

### Categories
- `GET /categories` - Listar todas as categorias
- `GET /categories/hierarchy` - Listar categorias em hierarquia
- `GET /categories/:id` - Buscar categoria por ID
- `POST /categories` - Criar categoria
- `PATCH /categories/:id` - Atualizar categoria
- `DELETE /categories/:id` - Excluir categoria

## Exemplos de Uso

### 1. Dashboard Overview
```bash
# KPIs gerais do período
curl "http://localhost:8080/dash/overview?from=2025-01-01&to=2025-01-31"

# Resposta:
{
  "totalEntradas": 7136.55,
  "totalSaidas": 4054.45,
  "saldoFinalEstimado": 3082.10,
  "tarifas": 0.00,
  "investimentosAportes": 1200.00
}
```

### 2. Gastos por Categoria
```bash
# Gráfico pizza/rosca de gastos
curl "http://localhost:8080/dash/by-category?from=2025-01-01&to=2025-01-31"

# Resposta:
[
  {
    "categoria": "Alimentação",
    "subcategoria": "Restaurante",
    "qty": 12,
    "total": 1680.50,
    "ticketMedio": 140.04
  }
]
```

### 3. Evolução Temporal
```bash
# Gráfico de evolução (diário)
curl "http://localhost:8080/dash/series?from=2025-01-01&to=2025-01-31&groupBy=day"

# Gráfico de evolução (semanal)
curl "http://localhost:8080/dash/series?from=2025-01-01&to=2025-01-31&groupBy=week"

# Resposta:
{
  "seriesEntradas": [
    { "x": "2025-01-01", "y": 320.00 }
  ],
  "seriesSaidas": [
    { "x": "2025-01-01", "y": 210.00 }
  ]
}
```

### 4. Top Subcategorias
```bash
# Top 10 subcategorias de gastos
curl "http://localhost:8080/dash/top-subcategories?from=2025-01-01&to=2025-01-31"

# Resposta:
[
  {
    "subcategoria": "Restaurante",
    "categoria": "Alimentação",
    "total": 6800.00
  }
]
```

### 5. Listagem de Transações
```bash
# Listar todas as transações (com transferências)
curl "http://localhost:8080/transactions?from=2025-01-01&to=2025-01-31"

# Listar apenas gastos (excluir transferências)
curl "http://localhost:8080/transactions?from=2025-01-01&to=2025-01-31&includeTransfers=false"

# Filtrar por categoria
curl "http://localhost:8080/transactions?category=Alimentação&from=2025-01-01&to=2025-01-31"

# Filtrar por tipo
curl "http://localhost:8080/transactions?type=debito&from=2025-01-01&to=2025-01-31"

# Buscar por texto
curl "http://localhost:8080/transactions?q=supermercado&from=2025-01-01&to=2025-01-31"

# Paginação e ordenação
curl "http://localhost:8080/transactions?page=2&pageSize=10&sort=-data"

# Resposta:
{
  "items": [
    {
      "id": 123,
      "data": "2025-01-03",
      "descricaoOriginal": "Compra supermercado",
      "estabelecimento": "Supermercado ABC",
      "tipo": "debito",
      "valor": -89.90,
      "categoria": "Alimentação",
      "subcategoria": "Supermercado",
      "meioPagamento": "PIX",
      "confiancaClassificacao": 0.92,
      "isInternalTransfer": 0,
      "isCardBillPayment": 0,
      "isInvestment": 0
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 46
}
```

## Regras de Negócio

### Exclusões Automáticas
- **Transferências internas** (`is_internal_transfer=1`) são excluídas de entradas/saídas
- **Pagamentos de fatura** (`is_card_bill_payment=1`) são excluídos de saídas
- **Aportes de investimento** (`is_investment=1` + `tipo='debito'`) vão para KPI "Investimentos (Aportes)"
- **Rendimentos de investimento** (`is_investment=1` + `tipo='credito'`) contam como entradas

### Filtros de Transações
- `includeTransfers=false` (padrão): exclui transferências internas
- `includeTransfers=true`: inclui todas as transações
- `type`: filtra por tipo (credito/debito)
- `category`/`subcategory`: filtra por categoria
- `payment`: filtra por meio de pagamento
- `q`: busca textual em descrição/estabelecimento

### Ordenação
- Campos permitidos: `data`, `valor`, `categoria`, `confianca_classificacao`
- Prefixo `-` para ordem decrescente
- Exemplo: `sort=-data` (mais recentes primeiro)

## Variáveis de Ambiente

```env
PORT=8080
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173
API_KEY=changeme
DB_VENDOR=postgresql
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finance_db
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

## Configuração do Banco

O projeto utiliza PostgreSQL como banco de dados principal. Para configurar:

1. Instalar PostgreSQL localmente
2. Criar banco `finance_db`
3. Configurar variáveis de ambiente
4. Executar `npm run setup:db`

## Normalização de Métodos de Pagamento

### Setup Completo

```bash
# 1. Aplicar migrações e seeds
npm run db:push
npm run seed:payment-methods
npm run backfill:payment-methods

# 2. Ou usar script de setup completo
npm run setup:payment-methods
```

### Novos Endpoints

#### GET /payment-methods
Lista todos os métodos de pagamento disponíveis.

```bash
curl http://localhost:8080/payment-methods
```

**Response:**
```json
[
  {
    "id": 1,
    "code": "PIX",
    "label": "Pix",
    "aliases": "[\"PIX\",\"QR PIX\",\"QRPIX\",\"CHAVE PIX\"]"
  },
  {
    "id": 7,
    "code": "CARTAO_CREDITO",
    "label": "Cartão Crédito",
    "aliases": "[\"CREDITO\",\"CARTAO CREDITO\",\"COMPRA CRED\",\"FATURA CARTAO\"]"
  }
]
```

### Filtros Atualizados

#### GET /transactions
Novos filtros para métodos de pagamento:

```bash
# Filtrar por ID do método de pagamento
curl "http://localhost:8080/transactions?userId=1&paymentMethodId=1"

# Filtrar por código do método de pagamento
curl "http://localhost:8080/transactions?userId=1&paymentCode=PIX"

# Combinar filtros
curl "http://localhost:8080/transactions?userId=1&paymentMethodId=7&from=2024-01-01&to=2024-12-31"
```

**Response atualizado:**
```json
{
  "items": [
    {
      "id": 123,
      "data": "2024-01-15",
      "descricaoOriginal": "Transferência PIX",
      "valor": -100.00,
      "paymentMethodId": 1,
      "paymentCode": "PIX",
      "paymentLabel": "Pix",
      "meioPagamento": "Pix"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

### Ingestão Atualizada

#### POST /statements/ingest
Agora aceita `payment_method_id` nas transações:

```json
{
  "userId": 1,
  "periodStart": "2024-01-01",
  "periodEnd": "2024-01-31",
  "sourceFile": "extrato.xlsx",
  "transacoes": [
    {
      "data": "2024-01-15",
      "descricao_original": "Transferência PIX",
      "valor": -100.00,
      "tipo": "debito",
      "payment_method_id": 1,
      "category_id": 5,
      "movement_kind": "spend",
      "id_transacao": "hash123"
    }
  ]
}
```

**Comportamento:**
- Se `payment_method_id` fornecido: valida existência e preenche `meio_pagamento` automaticamente
- Se não fornecido: mantém `meio_pagamento` original (string)
- Campo `meio_pagamento` (string) será removido em versão futura

### Métodos de Pagamento Disponíveis

| ID | Code | Label | Uso |
|----|------|-------|-----|
| 1 | PIX | Pix | Transferências PIX |
| 2 | TED | TED | Transferências TED |
| 3 | DOC | DOC | Transferências DOC |
| 4 | TEF | TEF Interna | Transferências entre contas |
| 5 | BOLETO | Boleto | Pagamentos de boleto |
| 6 | CARTAO_DEBITO | Cartão Débito | Compras no débito |
| 7 | CARTAO_CREDITO | Cartão Crédito | Compras no crédito, faturas |
| 8 | SAQUE | Saque | Saques em ATM |
| 9 | TARIFA | Tarifa/Encargo | Tarifas, anuidades, IOF |
| 99 | OUTRO | Outro | Outros métodos |

### Compatibilidade

- ✅ Campo `meio_pagamento` (string) mantido durante transição
- ✅ Ingestão aceita `payment_method_id` e preenche string automaticamente
- ✅ Backfill é script separado (execução manual)
- ✅ Filtros antigos deprecados, novos filtros por ID/code
- ✅ Queries existentes continuam funcionando

## Documentação

Acesse `/docs` para ver a documentação Swagger da API.
