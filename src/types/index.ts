export interface Transaction {
  id?: number;
  date: string;
  description: string;
  merchant: string;
  type: "income" | "spend";
  amount: number;
  category: string; // DEPRECATED - manter para compatibilidade
  subcategory: string; // DEPRECATED - manter para compatibilidade
  category_id?: number;
  subcategory_id?: number;
  category_name?: string;
  subcategory_name?: string;
  category_slug?: string;
  subcategory_slug?: string;
  category_kind?: "spend" | "income" | "transfer" | "invest" | "fee";
  is_internal_transfer?: number;
  is_card_bill_payment?: number;
  is_investment?: number;
  expense_effective?: number;
  income_effective?: number;
  payment_method: string;
  payment_method_id?: number;
  bank_id?: number;
}

export interface CategorySummary {
  categoria: string;
  subcategoria: string | null;
  qtd_transacoes: number;
  total: number;
  ticket_medio: number;
}

export interface OverviewSummary {
  total_entradas: number;
  total_saidas: number;
  saldo_final_estimado: number;
  tarifas: number;
  investimentos_aportes: number;
}

export interface ExcelData {
  transacoes: Transaction[];
  resumoPorCategoria: CategorySummary[];
  visaoGeral: OverviewSummary;
  seriesData?:
    | Array<{
        x: string;
        entradas: number;
        saidas: number;
      }>
    | SeriesData;
  topSubcategories?: TopSubcategory[];
}

export interface Filters {
  periodo: [Date, Date] | null;
  categorias: string[];
  subcategorias: string[];
  meiosPagamento: string[];
  buscaTexto: string;
}

export interface KPIs {
  entradas: number;
  saidas: number;
  saldo: number;
  tarifas: number;
  investimentosAportes: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
    borderWidth?: number;
  }[];
}

export interface DateSeries {
  data: string;
  entradas: number;
  saidas: number;
}

// Novos tipos para categorias
export interface Category {
  id: number;
  name: string;
  slug: string;
  kind: "spend" | "income" | "transfer" | "invest" | "fee";
  parentId?: number;
}

export interface CategoryHierarchy extends Category {
  children?: CategoryHierarchy[];
}

export interface CategoryListResult {
  items: Category[];
  total: number;
}

export interface TopSubcategory {
  subcategoria: string;
  categoria: string;
  total: number;
}

export interface SeriesDataPoint {
  x: string;
  y: number;
}

export interface SeriesData {
  seriesEntradas: SeriesDataPoint[];
  seriesSaidas: SeriesDataPoint[];
}

// Novos tipos para CRUD de transações
export interface Bank {
  id: number;
  code: string;
  name: string;
}

export interface TransactionCreateDTO {
  date: string;
  amount: number;
  type: "income" | "spend";
  category_id: number;
  subcategory_id?: number;
  payment_method_id: number;
  bank_id: number;
  description?: string;
  merchant?: string;
}

export interface TransactionUpdateDTO {
  date?: string;
  amount?: number;
  type?: "income" | "spend";
  category_id?: number;
  subcategory_id?: number;
  payment_method_id?: number;
  bank_id?: number;
  description?: string;
  merchant?: string;
}
