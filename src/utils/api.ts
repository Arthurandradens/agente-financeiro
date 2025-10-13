// Cliente HTTP para consumir a API do backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
const API_KEY = import.meta.env.VITE_API_KEY || 'changeme'

interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

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
    category?: string[]
    subcategory?: string[]
    type?: string[]
    paymentMethod?: string[]
    q?: string
    page?: number
    pageSize?: number
    sort?: string
  } = {}) {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          params.append(key, value.join(','))
        } else {
          params.append(key, String(value))
        }
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
  ingestStatement: (data: any) => apiClient.ingestStatement(data)
}

export default api
