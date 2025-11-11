<template>
  <div class="card">
    <div class="card-header">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
        <i class="pi pi-chart-bar mr-2"></i>
        Top 10 Subcategorias
      </h3>
    </div>
    <div class="card-content">
      <div v-if="loading" class="flex justify-center items-center h-80">
        <ProgressSpinner />
      </div>
      <div
        v-else-if="chartData.labels.length === 0"
        class="h-80 flex items-center justify-center"
      >
        <div class="text-center text-gray-500 dark:text-gray-400">
          <i class="pi pi-chart-bar text-4xl mb-2"></i>
          <p>Nenhum dado para exibir</p>
        </div>
      </div>
      <Bar v-else :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import ProgressSpinner from "primevue/progressspinner";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
);

const store = useDashboardStore();
const loading = computed(() => store.loading);

const chartData = computed(() => store.chartSubcategoryData);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: function (context: any) {
          let label = context.label || "";
          if (label) {
            label += ": ";
          }
          if (context.parsed.y !== null) {
            label += new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(context.parsed.y);
          }
          return label;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function (value: any) {
          return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(value);
        },
      },
    },
  },
};
</script>
