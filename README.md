# Dashboard Financeiro

Uma SPA em Vue 3 para análise de extratos financeiros com gráficos interativos e filtros avançados.

## 🚀 Funcionalidades

- **Upload de Excel**: Carregue arquivos .xlsx gerados pelo pipeline de classificação
- **Filtros Avançados**: Filtre por período, categoria, subcategoria, meio de pagamento e busca textual
- **KPIs em Tempo Real**: Entradas, saídas, saldo e tarifas com exclusões automáticas
- **Gráficos Interativos**: 
  - Pizza: Gastos por categoria
  - Barras: Top 10 subcategorias
  - Linha: Evolução temporal (diário/semanal/mensal)
- **Tabela de Transações**: Com paginação, ordenação e exportação CSV
- **Persistência Local**: Dados salvos automaticamente no localStorage
- **Dark Mode**: Toggle entre modo claro e escuro
- **Responsivo**: Interface adaptável para mobile e desktop

## 🛠️ Stack Tecnológica

- **Vue 3** + **Vite** + **TypeScript**
- **Pinia** (gerenciamento de estado)
- **PrimeVue** (componentes UI) + **TailwindCSS** (estilos)
- **Chart.js** + **vue-chartjs** (gráficos)
- **SheetJS** (leitura de Excel)
- **Day.js** (manipulação de datas)

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn

## 🚀 Instalação e Execução

1. **Instalar dependências**:
```bash
npm install
```

2. **Executar em modo desenvolvimento**:
```bash
npm run dev
```

3. **Build para produção**:
```bash
npm run build
```

4. **Preview da build**:
```bash
npm run preview
```

## 📊 Como Usar

### 1. Carregar Arquivo Excel

1. Clique em "Carregar Arquivo Excel" na tela inicial
2. Selecione um arquivo .xlsx gerado pelo pipeline de classificação
3. O arquivo deve conter as abas:
   - **Transações**: Dados das transações
   - **Resumo por categoria**: Agregações por categoria
   - **Visão geral**: Totais gerais

### 2. Estrutura do Excel

O arquivo Excel deve ter a seguinte estrutura:

#### Aba "Transações" (colunas obrigatórias):
- `data` (YYYY-MM-DD)
- `tipo` (credito|debito)
- `valor` (number)
- `categoria` (string)
- `descricao_original` (string)
- `estabelecimento` (string)
- `subcategoria` (string)
- `meio_pagamento` (string)
- `observacoes` (string)
- `confianca_classificacao` (number)

#### Aba "Resumo por categoria":
- `categoria`, `subcategoria`, `qtd_transacoes`, `total`, `ticket_medio`

#### Aba "Visão geral":
- `total_entradas`, `total_saidas`, `saldo_final_estimado`

### 3. Filtros Disponíveis

- **Período**: Selecione um intervalo de datas
- **Categorias**: Filtre por uma ou mais categorias
- **Subcategorias**: Filtre por subcategorias (dependente das categorias)
- **Meio de Pagamento**: Filtre por PIX, cartão, boleto, etc.
- **Busca Textual**: Pesquise em descrições e estabelecimentos

### 4. Regras de Negócio

O sistema automaticamente **exclui** dos cálculos:
- **Transferências internas** (categoria contém "Transferência interna")
- **Pagamento de fatura de cartão** (categoria contém "Cartão – Pagamento de fatura")

Essas exclusões se aplicam aos KPIs e gráficos.

### 5. Exportação

- **CSV**: Exporte a tabela filtrada em formato CSV
- **Persistência**: Dados são salvos automaticamente no localStorage

## 🎨 Interface

### KPIs (Cards)
- **Entradas**: Total de créditos (excluindo transferências internas)
- **Saídas**: Total de débitos (excluindo transferências internas)
- **Saldo**: Entradas - Saídas
- **Tarifas**: Gastos em "Serviços financeiros/Tarifas"

### Gráficos
- **Pizza**: Distribuição de gastos por categoria
- **Barras**: Top 10 subcategorias por valor
- **Linha**: Evolução temporal com opções diário/semanal/mensal

### Tabela de Transações
- Paginação (10, 20, 50, 100 itens por página)
- Ordenação por qualquer coluna
- Indicador de baixa confiança (≤40%)
- Totais no rodapé

## 🔧 Desenvolvimento

### Estrutura do Projeto

```
src/
├── components/          # Componentes Vue
│   ├── UploadArea.vue
│   ├── FiltersBar.vue
│   ├── KpiCards.vue
│   ├── Chart*.vue
│   └── TransactionsTable.vue
├── pages/              # Páginas
│   └── DashboardPage.vue
├── stores/             # Pinia stores
│   └── useDashboardStore.ts
├── utils/              # Utilitários
│   ├── excel.ts
│   └── format.ts
├── types/              # Tipos TypeScript
│   └── index.ts
└── main.ts
```

### Principais Funcionalidades

- **Store Pinia**: Gerencia estado global com computed properties reativas
- **Leitura Excel**: SheetJS para processar arquivos .xlsx
- **Filtros**: Sistema de filtros em cascata com reatividade
- **Gráficos**: Chart.js com configurações personalizadas
- **Persistência**: localStorage para cache de dados

## 🐛 Solução de Problemas

### Erro ao carregar Excel
- Verifique se o arquivo tem as abas obrigatórias
- Confirme se as colunas essenciais estão presentes
- Verifique se os dados estão no formato correto

### Gráficos não aparecem
- Verifique se há dados após aplicar os filtros
- Confirme se as transações têm valores válidos

### Performance lenta
- Use filtros para reduzir a quantidade de dados
- Evite carregar arquivos muito grandes (>10k transações)

## 📝 Licença

MIT License
