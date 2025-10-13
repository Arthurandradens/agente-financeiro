<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center">
            <i class="pi pi-chart-line text-2xl text-blue-600 dark:text-blue-400 mr-3"></i>
            <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
              Dashboard Financeiro
            </h1>
          </div>
          
          <div class="flex items-center space-x-4">
            <!-- Dark mode toggle -->
            <Button
              :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
              severity="secondary"
              size="small"
              @click="toggleDarkMode"
              v-tooltip.top="isDark ? 'Modo claro' : 'Modo escuro'"
            />
            
            <!-- File info -->
            <div v-if="hasData" class="flex items-center space-x-2">
              <i class="pi pi-file-excel text-green-600 dark:text-green-400"></i>
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ fileName }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
        <div class="text-center">
          <ProgressSpinner size="50" />
          <p class="text-gray-600 dark:text-gray-400 mt-4">
            Carregando dados...
          </p>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="!hasData">
        <EmptyState @upload="showUpload = true" />
       
        <!-- Componente de teste -->
        <!-- <TestComponent /> -->
        
        <!-- Botão de teste direto -->
        <!-- <div class="mt-8 text-center">
          <Button
            label="Teste: Carregar Arquivo"
            icon="pi pi-upload"
            @click="showUpload = true"
            class="mr-4"
          />
        </div> -->
      </div>

      <!-- Dashboard content -->
      <div v-else>
        <!-- Filters -->
        <FiltersBar />
        
        <!-- KPIs -->
        <KpiCards />
        
        <!-- Charts grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChartCategoryPie />
          <ChartSubcategoryBar />
        </div>
        
        <!-- Trend chart -->
        <div class="mb-6">
          <ChartTrendLine />
        </div>
        
        <!-- Transactions table -->
        <TransactionsTable />
      </div>
    </main>

    <!-- Upload modal -->
    <div
      v-if="showUpload"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showUpload = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Carregar Arquivo Excel
          </h3>
          <Button
            icon="pi pi-times"
            severity="secondary"
            size="small"
            @click="showUpload = false"
          />
        </div>
        
        <UploadArea @uploaded="showUpload = false" />
      </div>
    </div>
    
    <!-- Toast para notificações -->
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { loadFromLocalStorage } from '@/utils/excel'
import UploadArea from '@/components/UploadArea.vue'
import FiltersBar from '@/components/FiltersBar.vue'
import KpiCards from '@/components/KpiCards.vue'
import ChartCategoryPie from '@/components/ChartCategoryPie.vue'
import ChartSubcategoryBar from '@/components/ChartSubcategoryBar.vue'
import ChartTrendLine from '@/components/ChartTrendLine.vue'
import TransactionsTable from '@/components/TransactionsTable.vue'
import EmptyState from '@/components/EmptyState.vue'
// Componentes PrimeVue registrados globalmente
// import exampleData from '../exemplo-dados.json'

const store = useDashboardStore()
const showUpload = ref(false)
const isDark = ref(false)

const hasData = computed(() => store.hasData)
const loading = computed(() => store.loading)
const fileName = computed(() => store.fileName)

const toggleDarkMode = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('darkMode', isDark.value.toString())
}

const loadExampleData = () => {
//       store.setData(exampleData, 'exemplo-dados.xlsx')
}

onMounted(() => {
  // Load dark mode preference
  const savedDarkMode = localStorage.getItem('darkMode')
  if (savedDarkMode === 'true') {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
  
  // Try to load cached data
  const cached = loadFromLocalStorage()
  if (cached) {
    store.setData(cached.data, cached.fileName)
  }
})
</script>
