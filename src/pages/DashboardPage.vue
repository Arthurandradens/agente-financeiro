<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header
      class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center">
            <i
              class="pi pi-chart-line text-2xl text-blue-600 dark:text-blue-400 mr-3"
            ></i>
            <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
              Dashboard Financeiro
            </h1>
          </div>

          <div class="flex items-center space-x-4">
            <!-- Upload button -->
            <Button
              icon="pi pi-upload"
              severity="primary"
              size="small"
              @click="showUpload = true"
              v-tooltip.top="'Carregar extrato (CSV ou Excel)'"
              class="mr-2"
            />

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
              <i
                v-if="useApi"
                class="pi pi-cloud text-blue-600 dark:text-blue-400"
              ></i>
              <i
                v-else
                class="pi pi-file-excel text-green-600 dark:text-green-400"
              ></i>
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ fileName }}
                <span v-if="useApi" class="text-blue-600 dark:text-blue-400"
                  >(API)</span
                >
              </span>
            </div>

            <!-- API Error -->
            <div v-if="apiError" class="flex items-center space-x-2">
              <i
                class="pi pi-exclamation-triangle text-red-600 dark:text-red-400"
              ></i>
              <span class="text-sm text-red-600 dark:text-red-400">
                Erro API: {{ apiError }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading state -->
      <div
        v-if="loading"
        class="flex items-center justify-center min-h-[400px]"
      >
        <div class="text-center">
          <ProgressSpinner size="50" />
          <p class="text-gray-600 dark:text-gray-400 mt-4">
            Carregando dados...
          </p>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="!hasData">
        <EmptyState
          :api-available="apiAvailable"
          @upload="showUpload = true"
          @load-from-api="store.loadFromApi()"
        />

        <!-- API Options -->
        <div v-if="apiAvailable" class="mt-8 text-center">
          <div
            class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6"
          >
            <div class="flex items-center justify-center mb-4">
              <i
                class="pi pi-cloud text-blue-600 dark:text-blue-400 text-2xl mr-2"
              ></i>
              <h3
                class="text-lg font-semibold text-blue-900 dark:text-blue-100"
              >
                API Backend Disponível
              </h3>
            </div>
            <p class="text-blue-700 dark:text-blue-300 mb-4">
              Seus dados estão disponíveis na API. Clique para carregar
              automaticamente.
            </p>
            <Button
              label="Carregar da API"
              icon="pi pi-cloud"
              @click="store.loadFromApi()"
              class="mr-4"
            />
            <Button
              label="Upload Excel"
              icon="pi pi-upload"
              severity="secondary"
              @click="showUpload = true"
            />
          </div>
        </div>

        <!-- Fallback quando API não disponível -->
        <div v-else class="mt-8 text-center">
          <div
            class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
          >
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              API não disponível. Faça upload de um arquivo Excel para começar.
            </p>
            <Button
              label="Upload Excel"
              icon="pi pi-upload"
              @click="showUpload = true"
            />
          </div>
        </div>
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
        <TransactionsTable @edit="handleEditTransaction" />
      </div>
    </main>

    <!-- Floating Add Button -->
    <FloatingAddButton @click="handleAddTransaction" />

    <!-- Transaction Modal -->
    <TransactionModal
      v-if="showTransactionModal"
      :visible="showTransactionModal"
      :editing-transaction="editingTransaction"
      @close="handleCloseModal"
      @saved="handleTransactionSaved"
    />

    <!-- Upload modal -->
    <div
      v-if="showUpload"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showUpload = false"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Carregar Extrato
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

    <!-- Confirm Dialog para exclusões -->
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { loadFromLocalStorage } from "@/utils/excel";
import UploadArea from "@/components/UploadArea.vue";
import FiltersBar from "@/components/FiltersBar.vue";
import KpiCards from "@/components/KpiCards.vue";
import ChartCategoryPie from "@/components/ChartCategoryPie.vue";
import ChartSubcategoryBar from "@/components/ChartSubcategoryBar.vue";
import ChartTrendLine from "@/components/ChartTrendLine.vue";
import TransactionsTable from "@/components/TransactionsTable.vue";
import EmptyState from "@/components/EmptyState.vue";
import FloatingAddButton from "@/components/FloatingAddButton.vue";
import TransactionModal from "@/components/TransactionModal.vue";
// Componentes PrimeVue registrados globalmente
// import exampleData from '../exemplo-dados.json'

const store = useDashboardStore();
const showUpload = ref(false);
const isDark = ref(false);
const apiAvailable = ref(false);

// Transaction modal state
const showTransactionModal = ref(false);
const editingTransaction = ref<any>(null);

const hasData = computed(() => store.hasData);
const loading = computed(() => store.loading);
const fileName = computed(() => store.fileName);
const useApi = computed(() => store.useApi);
const apiError = computed(() => store.apiError);

const toggleDarkMode = () => {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle("dark", isDark.value);
  localStorage.setItem("darkMode", isDark.value.toString());
};

// Transaction modal methods
const handleAddTransaction = () => {
  editingTransaction.value = null;
  showTransactionModal.value = true;
};

const handleEditTransaction = (transaction: any) => {
  editingTransaction.value = transaction;
  showTransactionModal.value = true;
};

const handleCloseModal = () => {
  showTransactionModal.value = false;
  editingTransaction.value = null;
};

const handleTransactionSaved = () => {
  showTransactionModal.value = false;
  editingTransaction.value = null;
};

onMounted(async () => {
  // Load dark mode preference
  const savedDarkMode = localStorage.getItem("darkMode");
  if (savedDarkMode === "true") {
    isDark.value = true;
    document.documentElement.classList.add("dark");
  }

  // Tentar carregar da API automaticamente
  try {
    const isApiHealthy = await store.checkApiHealth();
    if (isApiHealthy) {
      apiAvailable.value = true;
      await store.loadFromApi();
    }
  } catch (error) {
    console.log("API não disponível, tentando carregar cache local");
    // Try to load cached data
    const cached = loadFromLocalStorage();
    if (cached) {
      store.setData(cached.data, cached.fileName);
    }
  }
});
</script>
