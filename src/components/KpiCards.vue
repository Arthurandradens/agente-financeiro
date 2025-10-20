<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-6">
    <!-- Entradas -->
    <div class="card kpi-card success">
      <div class="card-content">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
              Entradas
            </p>
            <p class="text-2xl font-bold text-green-700 dark:text-green-300">
              {{ formatCurrency(kpis.entradas) }}
            </p>
          </div>
          <div class="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
            <i class="pi pi-arrow-up text-green-600 dark:text-green-400 text-xl"></i>
          </div>
        </div>
        <p class="text-xs text-green-600 dark:text-green-400 mt-2">
          Excluindo transferências internas
        </p>
      </div>
    </div>
    
    <!-- Saídas -->
    <div class="card kpi-card danger">
      <div class="card-content">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
              Saídas
            </p>
            <p class="text-2xl font-bold text-red-700 dark:text-red-300">
              {{ formatCurrency(kpis.saidas) }}
            </p>
          </div>
          <div class="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
            <i class="pi pi-arrow-down text-red-600 dark:text-red-400 text-xl"></i>
          </div>
        </div>
        <p class="text-xs text-red-600 dark:text-red-400 mt-2">
          Excluindo transferências internas
        </p>
      </div>
    </div>
    
    <!-- Saldo -->
    <div class="card kpi-card" :class="kpis.saldo >= 0 ? 'success' : 'danger'">
      <div class="card-content">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium mb-1" :class="kpis.saldo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
              Saldo
            </p>
            <p class="text-2xl font-bold" :class="kpis.saldo >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'">
              {{ formatCurrency(kpis.saldo) }}
            </p>
          </div>
          <div class="p-3 rounded-full" :class="kpis.saldo >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'">
            <i class="pi pi-wallet text-xl" :class="kpis.saldo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"></i>
          </div>
        </div>
        <p class="text-xs mt-2" :class="kpis.saldo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
          {{ kpis.saldo >= 0 ? 'Positivo' : 'Negativo' }}
        </p>
      </div>
    </div>
    
    <!-- Tarifas -->
    <div class="card kpi-card">
      <div class="card-content">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
              Tarifas
            </p>
            <p class="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {{ formatCurrency(kpis.tarifas) }}
            </p>
          </div>
          <div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <i class="pi pi-credit-card text-blue-600 dark:text-blue-400 text-xl"></i>
          </div>
        </div>
        <p class="text-xs text-blue-600 dark:text-blue-400 mt-2">
          Serviços financeiros
        </p>
      </div>
    </div>
    
    <!-- Investimentos (Aportes) -->
    <div class="card kpi-card">
      <div class="card-content">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">
              Investimentos (Aportes)
            </p>
            <p class="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {{ formatCurrency(kpis.investimentosAportes) }}
            </p>
          </div>
          <div class="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
            <i class="pi pi-chart-line text-purple-600 dark:text-purple-400 text-xl"></i>
          </div>
        </div>
        <p class="text-xs text-purple-600 dark:text-purple-400 mt-2">
          Aportes em investimentos
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { formatCurrency } from '@/utils/format'

const store = useDashboardStore()
const kpis = computed(() => store.kpis)
</script>