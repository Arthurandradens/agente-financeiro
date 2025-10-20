<template>
  <div class="card">
    <div class="card-header">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          <i class="pi pi-table mr-2"></i>
          Transações ({{ filteredTransactions.length }})
        </h3>
        <div class="flex gap-2">
          <Button
            label="Exportar CSV"
            icon="pi pi-download"
            severity="secondary"
            size="small"
            @click="exportCSV"
            :disabled="filteredTransactions.length === 0"
          />
        </div>
      </div>
    </div>
    
    <div class="card-content">
      <div v-if="loading" class="flex justify-center items-center py-8">
        <ProgressSpinner />
      </div>
      <div v-else-if="filteredTransactions.length === 0" class="text-center py-8">
        <i class="pi pi-table text-4xl text-gray-400 dark:text-gray-600 mb-4"></i>
        <p class="text-gray-600 dark:text-gray-400">
          Nenhuma transação encontrada
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-500">
          Ajuste os filtros ou carregue um arquivo
        </p>
      </div>
      <DataTable v-else 
        :value="filteredTransactions" 
        :paginator="true" 
        :rows="20"
        :rowsPerPageOptions="[10, 20, 50]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} transações"
        class="p-datatable-sm"
        
        :scrollable="true"
        scrollHeight="400px"
      >
        <Column field="data" header="Data" :sortable="true">
          <template #body="{ data }">
            {{ formatDate(data.data) }}
          </template>
        </Column>
        
        <Column field="descricao_original" header="Descrição" :sortable="true">
          <template #body="{ data }">
            <div class="max-w-xs truncate" :title="data.descricao_original">
              {{ data.descricao_original }}
            </div>
          </template>
        </Column>
        
        <Column field="estabelecimento" header="Estabelecimento" :sortable="true">
          <template #body="{ data }">
            <div class="max-w-xs truncate" :title="data.estabelecimento">
              {{ data.estabelecimento }}
            </div>
          </template>
        </Column>
        
        <Column field="tipo" header="Tipo" :sortable="true">
          <template #body="{ data }">
            <Badge 
              :value="data.tipo === 'credito' ? 'Entrada' : 'Saída'"
              :severity="data.tipo === 'credito' ? 'success' : 'danger'"
            />
          </template>
        </Column>
        
        <Column field="valor" header="Valor" :sortable="true">
          <template #body="{ data }">
            <span :class="data.tipo === 'credito' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
              {{ formatCurrency(data.tipo === 'credito' ? data.valor : -Math.abs(data.valor)) }}
            </span>
          </template>
        </Column>
        
        <Column field="categoria" header="Categoria" :sortable="true">
          <template #body="{ data }">
            <Tag :value="data.categoria" severity="info" />
          </template>
        </Column>
        
        <Column field="subcategoria" header="Subcategoria" :sortable="true">
          <template #body="{ data }">
            <span v-if="data.subcategoria">{{ data.subcategoria }}</span>
            <span v-else class="text-gray-400">-</span>
          </template>
        </Column>
        
        <Column field="meio_pagamento" header="Meio" :sortable="true">
          <template #body="{ data }">
            <span v-if="data.meio_pagamento">{{ data.meio_pagamento }}</span>
            <span v-else class="text-gray-400">-</span>
          </template>
        </Column>
        
        <!-- <Column field="confianca_classificacao" header="Confiança" :sortable="true">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <span>{{ Math.round(data.confianca_classificacao * 100) }}%</span>
              <i v-if="data.confianca_classificacao <= 0.4" 
                 class="pi pi-exclamation-triangle text-yellow-500" 
                 v-tooltip.top="'Classificação com baixa confiança'">
              </i>
            </div>
          </template>
        </Column> -->
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { formatCurrency, formatDate } from '@/utils/format'

const store = useDashboardStore()
const loading = computed(() => store.loading)
const filteredTransactions = computed(() => store.filteredTransactions)

const exportCSV = () => {
  if (filteredTransactions.value.length === 0) return
  
  const headers = [
    'Data', 'Descrição', 'Estabelecimento', 'Tipo', 'Valor', 
    'Categoria', 'Subcategoria', 'Meio de Pagamento', 'Confiança'
  ]
  
  const csvContent = [
    headers.join(','),
    ...filteredTransactions.value.map(t => [
      t.data,
      `"${t.descricao_original}"`,
      `"${t.estabelecimento}"`,
      t.tipo === 'credito' ? 'Entrada' : 'Saída',
      t.tipo === 'credito' ? t.valor : -Math.abs(t.valor),
      `"${t.categoria}"`,
      `"${t.subcategoria || ''}"`,
      `"${t.meio_pagamento || ''}"`,
      Math.round(t.confianca_classificacao * 100)
    ].join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `transacoes_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>