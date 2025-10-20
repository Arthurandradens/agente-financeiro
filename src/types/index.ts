export interface Transaction {
  data: string
  descricao_original: string
  estabelecimento: string
  cnpj: string
  tipo: 'credito' | 'debito'
  valor: number
  categoria: string // DEPRECATED - manter para compatibilidade
  subcategoria: string // DEPRECATED - manter para compatibilidade
  categoryId?: number
  subcategoryId?: number
  category_name?: string
  subcategory_name?: string
  category_slug?: string
  subcategory_slug?: string
  category_kind?: 'spend' | 'income' | 'transfer' | 'invest' | 'fee'
  isInternalTransfer?: number
  isCardBillPayment?: number
  isInvestment?: number
  isRefundOrChargeback?: number
  expense_effective?: number
  income_effective?: number
  meio_pagamento: string
  bank_id?: number
  observacoes: string
  confianca_classificacao: number
  id_transacao: string
}

export interface CategorySummary {
  categoria: string
  subcategoria: string | null
  qtd_transacoes: number
  total: number
  ticket_medio: number
}

export interface OverviewSummary {
  total_entradas: number
  total_saidas: number
  saldo_final_estimado: number
  tarifas: number
  investimentos_aportes: number
}

export interface ExcelData {
  transacoes: Transaction[]
  resumoPorCategoria: CategorySummary[]
  visaoGeral: OverviewSummary
  seriesData?: Array<{
    x: string
    entradas: number
    saidas: number
  }> | SeriesData
  topSubcategories?: TopSubcategory[]
}

export interface Filters {
  periodo: [Date, Date] | null
  categorias: string[]
  subcategorias: string[]
  meiosPagamento: string[]
  buscaTexto: string
}

export interface KPIs {
  entradas: number
  saidas: number
  saldo: number
  tarifas: number
  investimentosAportes: number
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string[]
    borderColor?: string
    borderWidth?: number
  }[]
}

export interface DateSeries {
  data: string
  entradas: number
  saidas: number
}

// Novos tipos para categorias
export interface Category {
  id: number
  name: string
  slug: string
  kind: 'spend' | 'income' | 'transfer' | 'invest' | 'fee'
  parentId?: number
}

export interface CategoryHierarchy extends Category {
  children?: CategoryHierarchy[]
}

export interface CategoryListResult {
  items: Category[]
  total: number
}

export interface TopSubcategory {
  subcategoria: string
  categoria: string
  total: number
}

export interface SeriesDataPoint {
  x: string
  y: number
}

export interface SeriesData {
  seriesEntradas: SeriesDataPoint[]
  seriesSaidas: SeriesDataPoint[]
}
