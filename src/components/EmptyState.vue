<template>
  <div class="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
    <i class="pi pi-inbox text-6xl text-gray-400 dark:text-gray-600 mb-4"></i>
    <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
      Nenhum arquivo carregado
    </h3>
    <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
      Carregue um arquivo Excel (.xlsx) para visualizar o dashboard financeiro com gráficos e análises.
    </p>
    <Button
      label="Carregar Arquivo"
      icon="pi pi-upload"
      @click="$emit('upload')"
    />
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  upload: []
}>()
</script>
