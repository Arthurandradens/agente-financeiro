<template>
  <div class="card mb-6">
    <div class="card-header">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          <i class="pi pi-filter mr-2"></i>
          Filtros
        </h3>
        <Button
          label="Limpar Filtros"
          icon="pi pi-times"
          severity="secondary"
          size="small"
          @click="clearFilters"
        />
      </div>
    </div>

    <div class="card-content">
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
      >
        <!-- Período -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Período
          </label>
          <DatePicker
            v-model="filters.periodo"
            selectionMode="range"
            :manualInput="false"
            :showIcon="true"
            dateFormat="dd/mm/yy"
            placeholder="Selecionar período"
            class="w-full"
            :maxDate="new Date()"
            @show="periodoDirty.onShow"
            @update:modelValue="
              (value) => periodoDirty.onUpdate(value as [Date, Date] | null)
            "
            @hide="periodoDirty.onHide"
          />
        </div>

        <!-- Categorias -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Categorias
          </label>
          <MultiSelect
            v-model="filters.categorias"
            :options="store.filterOptions.categorias"
            optionLabel="name"
            optionValue="id"
            placeholder="Selecionar categorias"
            class="w-full"
            :showClear="true"
            :filter="true"
            :disabled="isApplyingFilters"
            @show="categoriasDirty.onShow"
            @update:modelValue="categoriasDirty.onUpdate"
            @hide="categoriasDirty.onHide"
          />
        </div>

        <!-- Subcategorias -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Subcategorias
          </label>
          <MultiSelect
            v-model="filters.subcategorias"
            :options="store.filterOptions.subcategorias"
            optionLabel="name"
            optionValue="id"
            placeholder="Selecionar subcategorias"
            class="w-full"
            :showClear="true"
            :filter="true"
            :disabled="isApplyingFilters"
            @show="subcategoriasDirty.onShow"
            @update:modelValue="subcategoriasDirty.onUpdate"
            @hide="subcategoriasDirty.onHide"
          />
        </div>

        <!-- Meio de Pagamento -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Meio de Pagamento
          </label>
          <MultiSelect
            v-model="filters.meiosPagamento"
            :options="store.filterOptions.meiosPagamento"
            optionLabel="label"
            optionValue="id"
            placeholder="Selecionar meios"
            class="w-full"
            :showClear="true"
            :filter="true"
            :disabled="isApplyingFilters"
            @show="meiosDirty.onShow"
            @update:modelValue="meiosDirty.onUpdate"
            @hide="meiosDirty.onHide"
          />
        </div>

        <!-- Busca Textual -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Busca Textual
          </label>
          <InputText
            v-model="filters.buscaTexto"
            placeholder="Buscar em descrições..."
            class="w-full"
            :disabled="isApplyingFilters"
            @focus="buscaDirty.onShow"
            @blur="buscaDirty.onHide"
            @input="
              (event) =>
                buscaDirty.onUpdate((event.target as HTMLInputElement).value)
            "
          />
        </div>
      </div>

      <!-- Loading indicator -->
      <div
        v-if="isApplyingFilters"
        class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <i class="pi pi-spin pi-spinner text-sm"></i>
          <span class="text-sm">Aplicando filtros...</span>
        </div>
      </div>

      <!-- Resumo dos filtros ativos -->
      <div
        v-else-if="hasActiveFilters"
        class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="flex flex-wrap gap-2">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            Filtros ativos:
          </span>

          <Tag v-if="filters.periodo" severity="info" class="text-xs">
            Período: {{ formatDateRange(filters.periodo) }}
          </Tag>

          <Tag
            v-if="filters.categorias.length > 0"
            severity="info"
            class="text-xs"
          >
            {{ filters.categorias.length }} categoria(s)
          </Tag>

          <Tag
            v-if="filters.subcategorias.length > 0"
            severity="info"
            class="text-xs"
          >
            {{ filters.subcategorias.length }} subcategoria(s)
          </Tag>

          <Tag
            v-if="filters.meiosPagamento.length > 0"
            severity="info"
            class="text-xs"
          >
            {{ filters.meiosPagamento.length }} meio(s) de pagamento
          </Tag>

          <Tag v-if="filters.buscaTexto" severity="info" class="text-xs">
            Busca: "{{ filters.buscaTexto }}"
          </Tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { formatDate } from "@/utils/format";
import { DatePicker } from "primevue";
import { useDirtyOnBlur } from "@/composables/useDirtyOnBlur";

const store = useDashboardStore();

const filters = computed(() => store.filters);
const isApplyingFilters = computed(() => store.loading);

// Handler para aplicar filtros
const applyFilters = async () => {
  if (store.useApi) {
    await store.fetchFromApiWithFilters();
  }
};

// Instâncias do composable para cada filtro
const categoriasDirty = useDirtyOnBlur(
  computed(() => filters.value.categorias),
  applyFilters,
);
const subcategoriasDirty = useDirtyOnBlur(
  computed(() => filters.value.subcategorias),
  applyFilters,
);
const meiosDirty = useDirtyOnBlur(
  computed(() => filters.value.meiosPagamento),
  applyFilters,
);
const periodoDirty = useDirtyOnBlur(
  computed(() => filters.value.periodo),
  applyFilters,
);
const buscaDirty = useDirtyOnBlur(
  computed(() => filters.value.buscaTexto),
  applyFilters,
);

const hasActiveFilters = computed(() => {
  return (
    filters.value.periodo ||
    filters.value.categorias.length > 0 ||
    filters.value.subcategorias.length > 0 ||
    filters.value.meiosPagamento.length > 0 ||
    filters.value.buscaTexto.length > 0
  );
});

const formatDateRange = (range: [Date, Date]) => {
  const [start, end] = range;
  return `${formatDate(start)} - ${formatDate(end)}`;
};

const clearFilters = async () => {
  store.resetFilters();
  if (store.useApi) {
    await store.fetchFromApiWithFilters();
  }
};

// Carregar opções quando o componente monta
onMounted(() => {
  if (store.useApi) {
    store.loadFilterOptions();
  }
});
</script>
