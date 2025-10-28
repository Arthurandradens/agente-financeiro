<template>
  <button
    @click="$emit('click')"
    class="floating-add-button"
    v-tooltip.top="'Adicionar Transação'"
  >
    <i class="pi pi-plus"></i>
  </button>
</template>

<script setup lang="ts">
// Emitir evento de clique
defineEmits<{
  click: []
}>()
</script>

<style scoped>
.floating-add-button {
  @apply fixed bottom-6 right-6 w-14 h-14 rounded-full;
  @apply bg-blue-600 hover:bg-blue-700 text-white;
  @apply shadow-lg hover:shadow-xl;
  @apply transition-all duration-300 ease-in-out;
  @apply hover:scale-110 active:scale-95;
  @apply backdrop-blur-sm bg-opacity-90;
  @apply border border-blue-500/20;
  @apply flex items-center justify-center;
  @apply z-50;
}

.floating-add-button i {
  @apply text-xl font-bold;
}

/* Efeito glassmorphism */
.floating-add-button::before {
  content: '';
  @apply absolute inset-0 rounded-full;
  @apply bg-gradient-to-br from-blue-500/20 to-blue-700/20;
  @apply backdrop-blur-sm;
  @apply -z-10;
}

/* Animação de hover */
.floating-add-button:hover::before {
  @apply bg-gradient-to-br from-blue-400/30 to-blue-600/30;
}

/* Responsivo */
@media (max-width: 640px) {
  .floating-add-button {
    @apply bottom-4 right-4 w-12 h-12;
  }
  
  .floating-add-button i {
    @apply text-lg;
  }
}
</style>

