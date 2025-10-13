<template>
  <div class="flex flex-col items-center justify-center min-h-[400px] p-8">
    <div class="text-center">
      <i class="pi pi-file-excel text-6xl text-blue-500 mb-4"></i>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Carregar Extrato Financeiro
      </h2>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        Selecione um arquivo Excel (.xlsx) gerado pelo pipeline de classificação
      </p>
      
      <!-- Área de upload com drag & drop -->
      <div 
        class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
        @click="triggerFileInput"
        @dragover.prevent
        @drop.prevent="handleDrop"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".xlsx"
          @change="handleFileSelect"
          class="hidden"
        />
        
        <div class="text-center">
          <i class="pi pi-cloud-upload text-4xl text-gray-400 dark:text-gray-500 mb-4"></i>
          <p class="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Clique aqui ou arraste o arquivo
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Apenas arquivos .xlsx são aceitos
          </p>
        </div>
      </div>
      
      <!-- Botão alternativo -->
      <div class="mt-4">
        <Button
          label="Selecionar Arquivo Excel"
          icon="pi pi-upload"
          class="px-6 py-3"
          :loading="loading"
          @click="triggerFileInput"
        />
      </div>
      
      <div v-if="loading" class="mt-4">
        <ProgressSpinner size="50" />
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Processando arquivo...
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { readExcelFile, saveToLocalStorage } from '@/utils/excel'
import { useToast } from 'primevue/usetoast'

const emit = defineEmits<{
  uploaded: []
}>()

const store = useDashboardStore()
const toast = useToast()

const fileInput = ref<HTMLInputElement>()
const loading = ref(false)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleDrop = (event: DragEvent) => {
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    processFile(files[0])
  }
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    await processFile(file)
  }
}

const processFile = async (file: File) => {
  if (!file.name.endsWith('.xlsx')) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Por favor, selecione um arquivo Excel (.xlsx)',
      life: 3000
    })
    return
  }
  
  loading.value = true
  store.setLoading(true)
  
  try {
    const data = await readExcelFile(file)
    store.setData(data, file.name)
    saveToLocalStorage(data, file.name)
    
    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: `Arquivo "${file.name}" carregado com sucesso!`,
      life: 3000
    })
    
    // Emitir evento de upload bem-sucedido
    emit('uploaded')
  } catch (error) {
    console.error('Erro ao processar arquivo:', error)
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: error instanceof Error ? error.message : 'Erro ao processar o arquivo',
      life: 5000
    })
  } finally {
    loading.value = false
    store.setLoading(false)
  }
}
</script>
