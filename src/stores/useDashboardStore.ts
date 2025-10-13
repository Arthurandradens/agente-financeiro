import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Transaction, ExcelData, Filters, KPIs } from '@/types'
import { api } from '@/utils/api'

export const useDashboardStore = defineStore('dashboard', () => {
  // State
  const data = ref<ExcelData | null>(null)
  const loading = ref(false)
  const fileName = ref('')
  const useApi = ref(false) // Toggle entre API e Excel local
  const apiError = ref<string | null>(null)
  
  const filters = ref<Filters>({
    periodo: null,
    categorias: [],
    subcategorias: [],
    meiosPagamento: [],
    buscaTexto: ''
  })

  const selectedTrendPeriod = ref<'day' | 'week' | 'month'>('day')

  // Getters
  const hasData = computed(() => data.value !== null)
  
  const filteredTransactions = computed(() => {
    if (!data.value) return []
    
    let transactions = data.value.transacoes || []
    
    // Aplicar filtros
    if (filters.value.periodo && filters.value.periodo.length === 2) {
      const [startDate, endDate] = filters.value.periodo
      transactions = transactions.filter(t => {
        const transactionDate = new Date(t.data)
        return transactionDate >= startDate && transactionDate <= endDate
      })
    }
    
    if (filters.value.categorias.length > 0) {
      transactions = transactions.filter(t => 
        filters.value.categorias.includes(t.categoria)
      )
    }
    
    if (filters.value.subcategorias.length > 0) {
      transactions = transactions.filter(t => 
        filters.value.subcategorias.includes(t.subcategoria)
      )
    }
    
    if (filters.value.meiosPagamento.length > 0) {
      transactions = transactions.filter(t => 
        filters.value.meiosPagamento.includes(t.meio_pagamento)
      )
    }
    
    if (filters.value.buscaTexto) {
      const searchTerm = filters.value.buscaTexto.toLowerCase()
      transactions = transactions.filter(t => 
        t.descricao_original.toLowerCase().includes(searchTerm) ||
        t.estabelecimento.toLowerCase().includes(searchTerm) ||
        t.observacoes.toLowerCase().includes(searchTerm)
      )
    }
    
    return transactions
  })
  
  const eligibleExpenses = computed(() => {
    return filteredTransactions.value.filter(t => {
      if (t.tipo !== 'debito') return false
      
      // Excluir transferências internas
      if (t.categoria === 'Transferências' && 
          (t.subcategoria === 'Transferência interna' || 
           t.observacoes.includes('transferência interna'))) {
        return false
      }
      
      // Excluir pagamentos de fatura de cartão
      if (t.categoria === 'Cartão de Crédito' && 
          t.subcategoria === 'Pagamento de fatura') {
        return false
      }
      
      return true
    })
  })
  
  const eligibleIncomes = computed(() => {
    return filteredTransactions.value.filter(t => {
      if (t.tipo !== 'credito') return false
      
      // Excluir transferências internas
      if (t.categoria === 'Transferências' && 
          (t.subcategoria === 'Transferência interna' || 
           t.observacoes.includes('transferência interna'))) {
        return false
      }
      
      return true
    })
  })
  
  const kpis = computed((): KPIs => {
    const entradas = eligibleIncomes.value.reduce((sum, t) => sum + t.valor, 0)
    const saidas = eligibleExpenses.value.reduce((sum, t) => sum + Math.abs(t.valor), 0)
    const saldo = entradas - saidas
    
    // Calcular tarifas da categoria "Serviços financeiros"
    const tarifas = filteredTransactions.value
      .filter(t => t.categoria === 'Serviços financeiros' && t.subcategoria === 'Tarifas')
      .reduce((sum, t) => sum + Math.abs(t.valor), 0)
    
    return { entradas, saidas, saldo, tarifas }
  })
  
  const chartCategoryData = computed(() => {
    if (!data.value) return { labels: [], datasets: [] }
    
    // Agrupar gastos por categoria
    const categoryTotals = eligibleExpenses.value.reduce((acc, t) => {
      const category = t.categoria || 'Outros'
      acc[category] = (acc[category] || 0) + Math.abs(t.valor)
      return acc
    }, {} as Record<string, number>)
    
    const labels = Object.keys(categoryTotals)
    const values = Object.values(categoryTotals)
    
    return {
      labels,
      datasets: [{
        label: 'Gastos por Categoria',
        data: values,
        backgroundColor: [
          '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
          '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
        ]
      }]
    }
  })
  
  const chartSubcategoryData = computed(() => {
    if (!data.value) return { labels: [], datasets: [] }
    
    // Agrupar gastos por subcategoria e pegar top 10
    const subcategoryTotals = eligibleExpenses.value.reduce((acc, t) => {
      const subcategory = t.subcategoria || 'Outros'
      acc[subcategory] = (acc[subcategory] || 0) + Math.abs(t.valor)
      return acc
    }, {} as Record<string, number>)
    
    const sortedSubcategories = Object.entries(subcategoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
    
    const labels = sortedSubcategories.map(([name]) => name)
    const values = sortedSubcategories.map(([,value]) => value)
    
    return {
      labels,
      datasets: [{
        label: 'Top 10 Subcategorias',
        data: values,
        backgroundColor: '#2563eb'
      }]
    }
  })
  
  const chartTrendData = computed(() => {
    if (!data.value) return { labels: [], datasets: [] }
    
    const transactions = filteredTransactions.value
    
    // Função para agrupar por período
    const groupByPeriod = (transactions: any[], period: 'day' | 'week' | 'month') => {
      const grouped = transactions.reduce((acc, t) => {
        let key: string
        
        if (period === 'day') {
          key = t.data
        } else if (period === 'week') {
          const date = new Date(t.data)
          const startOfWeek = new Date(date)
          startOfWeek.setDate(date.getDate() - date.getDay())
          key = startOfWeek.toISOString().split('T')[0]
        } else { // month
          const date = new Date(t.data)
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        }
        
        if (!acc[key]) {
          acc[key] = { entradas: 0, saidas: 0 }
        }
        
        if (t.tipo === 'credito') {
          acc[key].entradas += t.valor
        } else {
          acc[key].saidas += Math.abs(t.valor)
        }
        
        return acc
      }, {} as Record<string, { entradas: number, saidas: number }>)
      
      return grouped
    }
    
    const periodTotals = groupByPeriod(transactions, selectedTrendPeriod.value)
    
    // Ordenar as chaves
    const sortedKeys = Object.keys(periodTotals).sort()
    
    // Formatar labels baseado no período
    const formatLabel = (key: string) => {
      if (selectedTrendPeriod.value === 'day') {
        return key
      } else if (selectedTrendPeriod.value === 'week') {
        const date = new Date(key)
        const endOfWeek = new Date(date)
        endOfWeek.setDate(date.getDate() + 6)
        return `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${endOfWeek.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
      } else { // month
        const [year, month] = key.split('-')
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      }
    }
    
    const labels = sortedKeys.map(formatLabel)
    const entradas = sortedKeys.map(key => periodTotals[key].entradas)
    const saidas = sortedKeys.map(key => periodTotals[key].saidas)
    
    return {
      labels,
      datasets: [
        {
          label: 'Entradas',
          data: entradas,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          tension: 0.4
        },
        {
          label: 'Saídas',
          data: saidas,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          tension: 0.4
        }
      ]
    }
  })
  
  const availableCategories = computed(() => {
    if (!data.value) return []
    const categories = new Set(data.value.transacoes.map(t => t.categoria).filter(Boolean))
    return Array.from(categories).sort()
  })
  
  const availableSubcategories = computed(() => {
    if (!data.value) return []
    const subcategories = new Set(data.value.transacoes.map(t => t.subcategoria).filter(Boolean))
    return Array.from(subcategories).sort()
  })
  
  const availableMeiosPagamento = computed(() => {
    if (!data.value) return []
    const meios = new Set(data.value.transacoes.map(t => t.meio_pagamento).filter(Boolean))
    return Array.from(meios).sort()
  })
  
  const dateRange = computed(() => {
    return null
  })
  
  // Actions
  const setData = (newData: ExcelData, name: string) => {
    data.value = newData
    fileName.value = name
    resetFilters()
  }
  
  const setLoading = (value: boolean) => {
    loading.value = value
  }
  
  const updateFilters = (newFilters: Partial<Filters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }
  
  const resetFilters = () => {
    filters.value = {
      periodo: null,
      categorias: [],
      subcategorias: [],
      meiosPagamento: [],
      buscaTexto: ''
    }
  }
  
  const clearData = () => {
    data.value = null
    fileName.value = ''
    resetFilters()
  }

  const setTrendPeriod = (period: 'day' | 'week' | 'month') => {
    selectedTrendPeriod.value = period
  }

  // API Actions
  const fetchFromApi = async () => {
    if (!useApi.value) return
    
    loading.value = true
    apiError.value = null
    
    try {
      // Verificar se API está disponível
      await api.health()
      
      // Buscar dados do dashboard
      const [overview, byCategory, series] = await Promise.all([
        api.getOverview({ userId: 1 }),
        api.getByCategory({ userId: 1 }),
        api.getSeries({ userId: 1, groupBy: selectedTrendPeriod.value })
      ])
      
      // Simular estrutura ExcelData para compatibilidade
      const mockData: ExcelData = {
        transacoes: [], // Será preenchido via getTransactions se necessário
        resumoPorCategoria: byCategory,
        visaoGeral: overview
      }
      
      data.value = mockData
      fileName.value = 'API Backend'
      
    } catch (error: any) {
      apiError.value = error.message
      console.error('Erro ao buscar dados da API:', error)
    } finally {
      loading.value = false
    }
  }

  const fetchTransactions = async (filters: any = {}) => {
    if (!useApi.value) return []
    
    try {
      const result = await api.getTransactions({ userId: 1, ...filters })
      return result.items || []
    } catch (error: any) {
      console.error('Erro ao buscar transações:', error)
      return []
    }
  }

  const toggleApiMode = (enabled: boolean) => {
    useApi.value = enabled
    if (enabled) {
      fetchFromApi()
    } else {
      clearData()
    }
  }
  
  return {
    // State
    data,
    loading,
    fileName,
    filters,
    selectedTrendPeriod,
    useApi,
    apiError,
    
    // Getters
    hasData,
    filteredTransactions,
    eligibleExpenses,
    eligibleIncomes,
    kpis,
    chartCategoryData,
    chartSubcategoryData,
    chartTrendData,
    availableCategories,
    availableSubcategories,
    availableMeiosPagamento,
    dateRange,
    
    // Actions
    setData,
    setLoading,
    updateFilters,
    resetFilters,
    clearData,
    setTrendPeriod,
    
    // API Actions
    fetchFromApi,
    fetchTransactions,
    toggleApiMode
  }
})