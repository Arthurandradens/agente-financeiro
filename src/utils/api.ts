// Cliente HTTP para consumir a API do backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
const API_KEY = import.meta.env.VITE_API_KEY || 'changeme'


class ApiClient {
  private baseUrl: string
  private apiKey: string

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        ...options.headers
      }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return await response.json()
  }

  // Health check
  async health(): Promise<{ ok: boolean }> {
    return this.request('/health')
  }

  // Transactions
  async getTransactions(filters: {
    userId?: number
    from?: string
    to?: string
    category?: string
    subcategory?: string
    categoryId?: number
    subcategoryId?: number
    type?: string
    payment?: string
    categoryIds?: string
    subcategoryIds?: string
    paymentMethodIds?: string
    q?: string
    includeTransfers?: boolean
    page?: number
    pageSize?: number
    sort?: string
  } = {}) {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })

    const query = params.toString()
    return this.request(`/transactions${query ? `?${query}` : ''}`)
  }

  // Dashboard - Overview
  async getOverview(filters: {
    userId?: number
    from?: string
    to?: string
    categoryIds?: string
    subcategoryIds?: string
    paymentMethodIds?: string
    q?: string
  } = {}) {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })

    const query = params.toString()
    return this.request(`/dash/overview${query ? `?${query}` : ''}`)
  }

  // Dashboard - By Category
  async getByCategory(filters: {
    userId?: number
    from?: string
    to?: string
    categoryIds?: string
    subcategoryIds?: string
    paymentMethodIds?: string
    q?: string
  } = {}) {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })

    const query = params.toString()
    return this.request(`/dash/by-category${query ? `?${query}` : ''}`)
  }

  // Dashboard - Series
  async getSeries(filters: {
    userId?: number
    from?: string
    to?: string
    groupBy?: 'day' | 'week' | 'month'
    categoryIds?: string
    subcategoryIds?: string
    paymentMethodIds?: string
    q?: string
  } = {}) {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })

    const query = params.toString()
    return this.request(`/dash/series${query ? `?${query}` : ''}`)
  }

  // Dashboard - Top Subcategories
  async getTopSubcategories(filters: {
    userId?: number
    from?: string
    to?: string
    categoryIds?: string
    subcategoryIds?: string
    paymentMethodIds?: string
    q?: string
  } = {}) {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })

    const query = params.toString()
    return this.request(`/dash/top-subcategories${query ? `?${query}` : ''}`)
  }

  // Listar categorias para dropdown
  async getCategories() {
    return this.request('/categories')
  }

  // Listar métodos de pagamento para dropdown
  async getPaymentMethods() {
    return this.request('/payment-methods')
  }

  // Listar bancos
  async getBanks() {
    return this.request('/banks')
  }

  // CRUD de transações
  async createTransaction(data: {
    date: string
    amount: number
    type: 'credito' | 'debito'
    category_id: number
    subcategory_id?: number
    payment_method_id: number
    bank_id: number
    description?: string
    merchant?: string
  }) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateTransaction(id: number, data: {
    date?: string
    amount?: number
    type?: 'credito' | 'debito'
    category_id?: number
    subcategory_id?: number
    payment_method_id?: number
    bank_id?: number
    description?: string
    merchant?: string
  }) {
    return this.request(`/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async deleteTransaction(id: number) {
    return this.request(`/transactions/${id}`, {
      method: 'DELETE'
    })
  }

  // Ingest (para uso futuro)
  async ingestStatement(data: {
    userId: number
    periodStart: string
    periodEnd: string
    sourceFile: string
    transacoes: any[]
  }) {
    return this.request('/statements/ingest', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }


  async getCategoriesHierarchy() {
    return this.request('/categories/hierarchy')
  }

  async getCategory(id: number) {
    return this.request(`/categories/${id}`)
  }

  async createCategory(data: {
    name: string
    slug: string
    kind: 'spend' | 'income' | 'transfer' | 'invest' | 'fee'
    parentId?: number
  }) {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateCategory(id: number, data: Partial<{
    name: string
    slug: string
    kind: 'spend' | 'income' | 'transfer' | 'invest' | 'fee'
    parentId: number
  }>) {
    return this.request(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async deleteCategory(id: number) {
    return this.request(`/categories/${id}`, {
      method: 'DELETE'
    })
  }
}

// Instância global do cliente
export const apiClient = new ApiClient(API_BASE_URL, API_KEY)

// Funções de conveniência
export const api = {
  health: () => apiClient.health(),
  getTransactions: (filters?: any) => apiClient.getTransactions(filters),
  getOverview: (filters?: any) => apiClient.getOverview(filters),
  getByCategory: (filters?: any) => apiClient.getByCategory(filters),
  getSeries: (filters?: any) => apiClient.getSeries(filters),
  getTopSubcategories: (filters?: any) => apiClient.getTopSubcategories(filters),
  ingestStatement: (data: any) => apiClient.ingestStatement(data),
  getCategories: () => apiClient.getCategories(),
  getCategoriesHierarchy: () => apiClient.getCategoriesHierarchy(),
  getCategory: (id: number) => apiClient.getCategory(id),
  createCategory: (data: any) => apiClient.createCategory(data),
  updateCategory: (id: number, data: any) => apiClient.updateCategory(id, data),
  deleteCategory: (id: number) => apiClient.deleteCategory(id),
  getPaymentMethods: () => apiClient.getPaymentMethods(),
  getBanks: () => apiClient.getBanks(),
  createTransaction: (data: any) => apiClient.createTransaction(data),
  updateTransaction: (id: number, data: any) => apiClient.updateTransaction(id, data),
  deleteTransaction: (id: number) => apiClient.deleteTransaction(id)
}

export default api
