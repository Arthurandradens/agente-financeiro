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
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <!-- Período -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Período
          </label>
          <DatePicker
            v-model="filters.periodo"
            selectionMode="range"
            :manualInput="false"
            showIcon="true"
            dateFormat="dd/mm/yy"
            placeholder="Selecionar período"
            class="w-full"
            :maxDate="new Date()"
          />
        </div>
        
        <!-- Categorias -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Categorias
          </label>
          <MultiSelect
            v-model="filters.categorias"
            :options="availableCategories"
            placeholder="Selecionar categorias"
            class="w-full"
            :showClear="true"
            :filter="true"
          />
        </div>
        
        <!-- Subcategorias -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Subcategorias
          </label>
          <MultiSelect
            v-model="filters.subcategorias"
            :options="availableSubcategories"
            placeholder="Selecionar subcategorias"
            class="w-full"
            :showClear="true"
            :filter="true"
          />
        </div>
        
        <!-- Meio de Pagamento -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Meio de Pagamento
          </label>
          <MultiSelect
            v-model="filters.meiosPagamento"
            :options="availableMeiosPagamento"
            placeholder="Selecionar meios"
            class="w-full"
            :showClear="true"
            :filter="true"
          />
        </div>
        
        <!-- Busca Textual -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Busca Textual
          </label>
          <InputText
            v-model="filters.buscaTexto"
            placeholder="Buscar em descrições..."
            class="w-full"
          />
        </div>
      </div>
      
      <!-- Resumo dos filtros ativos -->
      <div v-if="hasActiveFilters" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div class="flex flex-wrap gap-2">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            Filtros ativos:
          </span>
          
          <Tag v-if="filters.periodo" severity="info" class="text-xs">
            Período: {{ formatDateRange(filters.periodo) }}
          </Tag>
          
          <Tag v-if="filters.categorias.length > 0" severity="info" class="text-xs">
            {{ filters.categorias.length }} categoria(s)
          </Tag>
          
          <Tag v-if="filters.subcategorias.length > 0" severity="info" class="text-xs">
            {{ filters.subcategorias.length }} subcategoria(s)
          </Tag>
          
          <Tag v-if="filters.meiosPagamento.length > 0" severity="info" class="text-xs">
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
import { computed, watch } from 'vue'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { formatDate } from '@/utils/format'
import { DatePicker } from 'primevue'

const store = useDashboardStore()

const filters = computed(() => store.filters)
const availableCategories = computed(() => store.availableCategories)
const availableSubcategories = computed(() => store.availableSubcategories)
const availableMeiosPagamento = computed(() => store.availableMeiosPagamento)

const hasActiveFilters = computed(() => {
  return filters.value.periodo ||
         filters.value.categorias.length > 0 ||
         filters.value.subcategorias.length > 0 ||
         filters.value.meiosPagamento.length > 0 ||
         filters.value.buscaTexto.length > 0
})

const formatDateRange = (range: [Date, Date]) => {
  const [start, end] = range
  return `${formatDate(start)} - ${formatDate(end)}`
}

const clearFilters = () => {
  store.resetFilters()
}

// Watch para atualizar filtros no store
watch(filters, (newFilters) => {
  store.updateFilters(newFilters)
}, { deep: true })
</script>
