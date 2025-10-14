export interface Transaction {
  data: string
  descricao_original: string
  estabelecimento: string
  cnpj: string
  tipo: 'credito' | 'debito'
  valor: number
  categoria: string
  subcategoria: string
  meio_pagamento: string
  banco_origem: string
  banco_destino: string
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
}

export interface ExcelData {
  transacoes: Transaction[]
  resumoPorCategoria: CategorySummary[]
  visaoGeral: OverviewSummary
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
