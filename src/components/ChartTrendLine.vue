<template>
  <div class="card">
    <div class="card-header">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          <i class="pi pi-chart-line mr-2"></i>
          Evolução Temporal
        </h3>
        <div class="flex gap-2">
          <Button
            v-for="period in periods"
            :key="period.value"
            :label="period.label"
            :severity="selectedPeriod === period.value ? 'primary' : 'secondary'"
            size="small"
            @click="selectedPeriod = period.value as 'day' | 'week' | 'month'"
          />
        </div>
      </div>
    </div>
    <div class="card-content">
      <div v-if="loading" class="flex justify-center items-center h-80">
        <ProgressSpinner />
      </div>
      <div v-else-if="chartData.labels.length === 0" class="h-80 flex items-center justify-center">
        <div class="text-center text-gray-500 dark:text-gray-400">
          <i class="pi pi-chart-line text-4xl mb-2"></i>
          <p>Nenhum dado para exibir</p>
        </div>
      </div>
      <Line v-else :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js'
import ProgressSpinner from 'primevue/progressspinner'

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement)

const store = useDashboardStore()
const loading = computed(() => store.loading)

const selectedPeriod = computed({
  get: () => store.selectedTrendPeriod,
  set: (value) => store.setTrendPeriod(value)
})

const periods = [
  { label: 'Diário', value: 'day' },
  { label: 'Semanal', value: 'week' },
  { label: 'Mensal', value: 'month' }
]

const chartData = computed(() => store.chartTrendData)

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
          }
          return label;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value: any) {
          return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
        }
      }
    }
  }
}
</script>