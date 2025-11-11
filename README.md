# Agente de Extrato Financeiro

Sistema completo para classificação automática e análise de extratos bancários com dashboard interativo. O projeto consiste em um **backend API** (Fastify + PostgreSQL), um **frontend** (Vue 3) e um **script de classificação** que utiliza IA para categorizar transações automaticamente.

## 🚀 Funcionalidades

### Backend API

- **Ingestão de transações**: Recebe extratos classificados e armazena no banco de dados
- **Dashboard endpoints**: KPIs, gráficos por categoria, séries temporais
- **Filtros avançados**: Por período, categoria, subcategoria, meio de pagamento, busca textual
- **Normalização de dados**: Categorias hierárquicas, métodos de pagamento padronizados
- **Exclusões automáticas**: Transferências internas e pagamentos de fatura não contam como gastos

### Frontend Dashboard

- **Visualização interativa**: Gráficos de pizza, barras e linha temporal
- **KPIs em tempo real**: Entradas, saídas, saldo e tarifas
- **Tabela de transações**: Com paginação, ordenação e filtros
- **Filtros avançados**: Interface intuitiva para todos os filtros disponíveis
- **Dark Mode**: Toggle entre modo claro e escuro
- **Responsivo**: Interface adaptável para mobile e desktop

### Script de Classificação

- **Classificação automática**: Utiliza OpenAI GPT para categorizar transações
- **Suporte a múltiplos formatos**: Mercado Pago e Nubank
- **Regras personalizáveis**: Sistema de regras baseado em JSON
- **Integração com API**: Envia dados automaticamente após classificação

## 📋 Pré-requisitos

### Software Necessário

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** ou **yarn** (vem com Node.js)
- **PostgreSQL** 15+ ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/downloads))

### Conta OpenAI (para classificação)

- Conta na OpenAI com API Key
- Créditos disponíveis para uso da API

## 🗄️ Configuração do Banco de Dados

### Opção 1: PostgreSQL Local

1. **Instalar PostgreSQL**:
   - Windows: Baixe o instalador do site oficial
   - macOS: `brew install postgresql@15`
   - Linux: `sudo apt-get install postgresql-15`

2. **Criar banco de dados**:

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco de dados
CREATE DATABASE finance_db;

# Criar usuário (se necessário)
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE finance_db TO postgres;

# Sair do psql
\q
```

3. **Configurar variáveis de ambiente** (veja seção abaixo)

### Opção 2: Docker (Recomendado)

O projeto inclui um `docker-compose.yml` que configura automaticamente o PostgreSQL:

```bash
cd api
docker-compose up -d postgres
```

Isso criará um container PostgreSQL com:

- **Banco**: `finance_db`
- **Usuário**: `postgres`
- **Senha**: `postgres`
- **Porta**: `5432`

## ⚙️ Configuração do Projeto

### 1. Clonar o Repositório

```bash
git clone <url-do-repositorio>
cd agente-extrato
```

### 2. Configurar Backend (API)

```bash
# Entrar na pasta da API
cd api

# Instalar dependências
npm install

# Criar arquivo .env
```

Crie um arquivo `.env` na pasta `api/` com o seguinte conteúdo:

```env
# Servidor
PORT=8080
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173

# Autenticação
API_KEY=changeme

# Banco de Dados
DB_VENDOR=postgresql
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finance_db

# Logs
LOG_LEVEL=info
```

**Importante**: Ajuste `DATABASE_URL` se suas credenciais do PostgreSQL forem diferentes.

### 3. Configurar Frontend

```bash
# Voltar para a raiz do projeto
cd ..

# Instalar dependências
npm install

# Criar arquivo .env (opcional)
```

Crie um arquivo `.env` na raiz do projeto (opcional, valores padrão já estão configurados):

```env
VITE_API_BASE_URL=http://127.0.0.1:8080
VITE_API_KEY=changeme
```

### 4. Configurar Script de Classificação

Crie um arquivo `.env` na raiz do projeto (se ainda não criou):

```env
# OpenAI
OPENAI_API_KEY=sua-chave-api-aqui
OPENAI_MODEL=gpt-4o-mini

# API (opcional - para envio automático)
API_BASE_URL=http://localhost:8080
API_KEY=changeme
```

**Como obter a chave da OpenAI**:

1. Acesse [OpenAI Platform](https://platform.openai.com/)
2. Faça login ou crie uma conta
3. Vá em "API Keys" no menu
4. Clique em "Create new secret key"
5. Copie a chave e cole no `.env`

## 🚀 Como Rodar o Projeto

### Passo 1: Inicializar o Banco de Dados

```bash
cd api

# Executar setup completo do banco
npm run setup:db
```

Este comando irá:

- Criar todas as tabelas (migrações)
- Popular categorias iniciais
- Popular métodos de pagamento
- Criar views otimizadas
- Popular bancos cadastrados

**Alternativa passo a passo**:

```bash
# Gerar e aplicar migrações
npm run db:push

# Popular dados iniciais
npm run seed:categories
npm run seed:payment-methods

```

### Passo 2: Iniciar o Backend

```bash
# Ainda na pasta api/
npm run dev
```

O servidor estará rodando em `http://localhost:8080`

**Verificar se está funcionando**:

```bash
curl http://localhost:8080/health
```

Deve retornar: `{"ok":true}`

### Passo 3: Iniciar o Frontend

Abra um **novo terminal** (mantenha o backend rodando):

```bash
# Na raiz do projeto
npm run dev
```

O frontend estará rodando em `http://localhost:5173`

Acesse no navegador: `http://localhost:5173`

## 📊 Como Usar o Script de Classificação

O script `classificar_extrato.js` processa arquivos CSV de extratos bancários e os classifica automaticamente usando IA.

### Formato de Uso

```bash
node classificar_extrato.js <caminho_do_csv> [arquivo_saida.xlsx] [prompt-agente.txt]
```

### Exemplos

```bash
# Classificar extrato do Mercado Pago
node classificar_extrato.js extrato_mercadopago.csv

# Especificar arquivo de saída
node classificar_extrato.js extrato_nubank.csv extrato_classificado.xlsx

# Usar prompt personalizado
node classificar_extrato.js extrato.csv saida.xlsx meu-prompt.txt
```

### Formatos Suportados

O script detecta automaticamente o formato do CSV:

1. **Mercado Pago**: CSV com cabeçalho `RELEASE_DATE;TRANSACTION_TYPE;...`
2. **Nubank**: CSV com cabeçalho `Data,Valor,Identificador,Descrição`

### Saída do Script

O script gera um arquivo Excel (`.xlsx`) com três abas:

1. **Transações**: Todas as transações classificadas com:
   - Data, descrição, valor, tipo
   - Categoria e subcategoria (IDs e labels)
   - Meio de pagamento
   - Flags (transferência interna, pagamento de fatura, etc.)
   - Confiança da classificação

2. **Resumo por categoria**: Agregação por categoria/subcategoria com:
   - Quantidade de transações
   - Total gasto
   - Ticket médio

3. **Visão geral**: Totais gerais:
   - Total de entradas
   - Total de saídas
   - Saldo final estimado

### Integração Automática com API

Se a API estiver rodando, o script **automaticamente** envia os dados classificados para o banco de dados. Configure as variáveis no `.env`:

```env
API_BASE_URL=http://localhost:8080
API_KEY=changeme
```

## ⚙️ Configuração de Regras

O arquivo `rules.json` contém as regras de classificação personalizadas. Este arquivo é usado pelo script de classificação e pela API.

### Estrutura do rules.json

```json
{
  "catalog": {
    "categories": [
      {
        "id": 100,
        "label": "Alimentação",
        "kind": "spend"
      },
      {
        "id": 101,
        "label": "Alimentação/Supermercado",
        "parentId": 100,
        "kind": "spend"
      }
    ],
    "payment_methods": [
      {
        "id": 1,
        "code": "PIX",
        "label": "Pix"
      }
    ]
  },
  "self_identifiers": {
    "names": ["Seu Nome"],
    "cpf_cnpj": ["123.456.789-00"]
  },
  "user_rules": [
    {
      "match": {
        "name_contains": "Nome do Estabelecimento"
      },
      "set": {
        "category_id": 100,
        "subcategory_id": 101,
        "movement_kind": "spend"
      },
      "reason": "Descrição da regra"
    }
  ]
}
```

### Seções do rules.json

#### 1. Catalog (Catálogo)

Define as categorias e métodos de pagamento disponíveis:

- **categories**: Lista de categorias e subcategorias
  - `id`: ID numérico único
  - `label`: Nome da categoria
  - `kind`: Tipo (`spend`, `income`, `transfer`, `invest`, `fee`)
  - `parentId`: ID da categoria pai (para subcategorias)

- **payment_methods**: Lista de métodos de pagamento
  - `id`: ID numérico único
  - `code`: Código único (ex: "PIX", "CARTAO_CREDITO")
  - `label`: Nome amigável

#### 2. self_identifiers (Identificadores Próprios)

Informações para detectar transferências internas:

- **names**: Lista de nomes próprios (para detectar transferências para si mesmo)
- **cpf_cnpj**: Lista de CPFs/CNPJs próprios

**Exemplo**:

```json
"self_identifiers": {
  "names": ["João Silva", "João da Silva"],
  "cpf_cnpj": ["123.456.789-00"]
}
```

#### 3. user_rules (Regras Personalizadas)

Regras específicas que têm **prioridade máxima** sobre a classificação automática:

- **match**: Critérios de correspondência
  - `name_contains`: Texto que deve aparecer no nome/descrição
  - `cnpj_equals`: CNPJ exato
  - `description_regex`: Expressão regular para descrição

- **set**: Valores a serem definidos quando a regra corresponder
  - `category_id`: ID da categoria
  - `subcategory_id`: ID da subcategoria (opcional)
  - `movement_kind`: Tipo de movimento

- **reason**: Descrição da regra (para documentação)

**Exemplo de regra**:

```json
{
  "match": {
    "name_contains": "Wise Brasil Corretora"
  },
  "set": {
    "category_id": 800,
    "subcategory_id": null,
    "movement_kind": "income"
  },
  "reason": "Salário da empresa Wise"
}
```

### Como Adicionar Novas Regras

1. Abra o arquivo `rules.json`
2. Adicione uma nova entrada em `user_rules`:

```json
{
  "match": {
    "name_contains": "Nome do Estabelecimento"
  },
  "set": {
    "category_id": 200,
    "subcategory_id": 201,
    "movement_kind": "spend"
  },
  "reason": "Sempre classificar este estabelecimento como Transporte/Combustível"
}
```

3. Salve o arquivo
4. Execute o script novamente - as novas regras serão aplicadas automaticamente

### Como Adicionar Novas Categorias

1. Abra o arquivo `rules.json`
2. Adicione a categoria em `catalog.categories`:

```json
{
  "id": 1500,
  "label": "Nova Categoria",
  "kind": "spend"
}
```

3. Se for subcategoria, adicione `parentId`:

```json
{
  "id": 1501,
  "label": "Nova Categoria/Subcategoria",
  "parentId": 1500,
  "kind": "spend"
}
```

4. **Importante**: Após adicionar categorias no `rules.json`, você precisa sincronizar com o banco de dados:

```bash
cd api
npm run seed:categories
```

## 🏗️ Estrutura do Projeto

```
agente-extrato/
├── api/                          # Backend API
│   ├── src/
│   │   ├── routes/               # Rotas da API
│   │   ├── services/             # Lógica de negócio
│   │   ├── schema/               # Schemas do banco (Drizzle)
│   │   ├── config/               # Configurações
│   │   └── server.ts             # Servidor Fastify
│   ├── scripts/                  # Scripts utilitários
│   ├── drizzle/                  # Migrações do banco
│   ├── docker-compose.yml        # Docker para PostgreSQL
│   └── package.json
│
├── src/                          # Frontend Vue
│   ├── components/               # Componentes Vue
│   ├── pages/                    # Páginas
│   ├── stores/                   # Pinia stores
│   ├── utils/                    # Utilitários
│   └── main.ts
│
├── classificar_extrato.js        # Script de classificação
├── rules.json                    # Regras de classificação
├── prompt-agente.txt             # Prompt para IA
└── package.json
```

## 🔧 Scripts Disponíveis

### Backend (api/)

```bash
# Desenvolvimento
npm run dev              # Inicia servidor com hot-reload

# Banco de dados
npm run db:generate      # Gera novas migrações
npm run db:migrate       # Aplica migrações
npm run db:push          # Gera e aplica migrações
npm run setup:db         # Setup completo do banco

# Seeds
npm run seed:categories  # Popular categorias
npm run seed:payment-methods  # Popular métodos de pagamento

# Testes
npm test                 # Executar testes
```

### Frontend (raiz)

```bash
npm run dev              # Desenvolvimento
npm run build            # Build para produção
npm run preview          # Preview da build
```

## 📡 Endpoints da API

### Health

- `GET /health` - Status da API

### Dashboard

- `GET /dash/overview` - KPIs gerais (entradas, saídas, saldo, tarifas)
- `GET /dash/by-category` - Gastos por categoria (para gráfico pizza)
- `GET /dash/series` - Séries temporais (para gráfico de linha)
- `GET /dash/top-subcategories` - Top 10 subcategorias (para gráfico barras)

### Transações

- `GET /transactions` - Listar transações (com filtros e paginação)
- `POST /transactions` - Criar transação manual
- `PATCH /transactions/:id` - Atualizar transação
- `DELETE /transactions/:id` - Excluir transação

### Statements (Extratos)

- `POST /statements/ingest` - Ingerir extrato classificado
- `GET /statements/:id` - Buscar extrato por ID

### Categorias

- `GET /categories` - Listar todas as categorias
- `GET /categories/hierarchy` - Listar em hierarquia
- `GET /categories/:id` - Buscar por ID
- `POST /categories` - Criar categoria
- `PATCH /categories/:id` - Atualizar categoria
- `DELETE /categories/:id` - Excluir categoria

### Métodos de Pagamento

- `GET /payment-methods` - Listar todos os métodos

### Documentação

- `GET /docs` - Documentação Swagger da API

## 🐛 Solução de Problemas

### Erro de conexão com banco de dados

**Problema**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Soluções**:

1. Verifique se o PostgreSQL está rodando:

   ```bash
   # Windows
   services.msc  # Procurar por PostgreSQL

   # Linux/Mac
   sudo systemctl status postgresql
   ```

2. Verifique as credenciais no `.env`:

   ```env
   DATABASE_URL=postgresql://usuario:senha@localhost:5432/finance_db
   ```

3. Teste a conexão:
   ```bash
   psql -U postgres -d finance_db
   ```

### Erro ao executar migrações

**Problema**: `Error: relation "categories" already exists`

**Solução**: Limpe o banco e recrie:

```bash
cd api
npm run db:clean
npm run setup:db
```

### Frontend não conecta com API

**Problema**: Erro `Failed to fetch` no console

**Soluções**:

1. Verifique se o backend está rodando em `http://localhost:8080`
2. Verifique a variável `VITE_API_BASE_URL` no `.env`
3. Verifique o CORS no backend (deve incluir `http://localhost:5173`)

### Erro ao classificar extrato

**Problema**: `Faltou OPENAI_API_KEY no .env`

**Solução**:

1. Crie arquivo `.env` na raiz do projeto
2. Adicione: `OPENAI_API_KEY=sua-chave-aqui`
3. Execute o script novamente

### Erro de formato de CSV

**Problema**: `Formato de CSV não reconhecido`

**Soluções**:

1. Verifique se o CSV é do Mercado Pago ou Nubank
2. Certifique-se de que o cabeçalho está presente
3. Verifique a codificação do arquivo (deve ser UTF-8)

## 📝 Licença

MIT License

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## 📧 Suporte

Para dúvidas ou problemas, abra uma issue no repositório.
