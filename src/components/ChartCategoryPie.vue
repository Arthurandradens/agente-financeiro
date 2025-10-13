<template>
  <div class="card">
    <div class="card-header">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
        <i class="pi pi-chart-pie mr-2"></i>
        Gastos por Categoria
      </h3>
    </div>
    <div class="card-content">
      <div v-if="loading" class="flex justify-center items-center h-80">
        <ProgressSpinner />
      </div>
      <div v-else-if="chartData.labels.length === 0" class="h-80 flex items-center justify-center">
        <div class="text-center text-gray-500 dark:text-gray-400">
          <i class="pi pi-chart-pie text-4xl mb-2"></i>
          <p>Nenhum dado para exibir</p>
        </div>
      </div>
      <Doughnut v-else :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import ProgressSpinner from 'primevue/progressspinner'

ChartJS.register(Title, Tooltip, Legend, ArcElement)

const store = useDashboardStore()
const loading = computed(() => store.loading)

const chartData = computed(() => store.chartCategoryData)

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          let label = context.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed !== null) {
            label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed);
          }
          return label;
        }
      }
    }
  }
}
</script>