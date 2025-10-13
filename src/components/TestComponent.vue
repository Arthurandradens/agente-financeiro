<template>
  <div class="p-4">
    <h2 class="text-xl font-bold mb-4">Teste de Componentes PrimeVue</h2>
    
    <div class="space-y-4">
      <div>
        <Button label="Botão Teste" />
      </div>
      
      <div>
        <InputText placeholder="Input de teste" />
      </div>
      
      <div>
        <Calendar placeholder="Calendário de teste" />
      </div>
      
      <div>
        <MultiSelect 
          :options="['Opção 1', 'Opção 2', 'Opção 3']"
          placeholder="MultiSelect de teste"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Componentes PrimeVue registrados globalmente
</script>
