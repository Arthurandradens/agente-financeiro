<template>
  <div
    v-show="visible"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="$emit('close')"
  >
    <div class="transaction-modal" @click.stop>
      <!-- Header -->
      <div class="modal-header">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {{ isEditing ? 'Editar Transação' : 'Nova Transação' }}
        </h3>
        <Button
          icon="pi pi-times"
          severity="secondary"
          size="small"
          @click="$emit('close')"
          class="!p-2"
        />
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="modal-content">
        <!-- Toggle de Tipo -->
        <div class="form-group">
          <label class="form-label">Tipo de Transação</label>
          <div class="toggle-container">
            <button
              type="button"
              @click="form.type = 'income'"
              :class="[
                'toggle-button',
                'toggle-entrada',
                form.type === 'income' ? 'toggle-active' : ''
              ]"
            >
              <i class="pi pi-arrow-up mr-2"></i>
              Entrada
            </button>
            <button
              type="button"
              @click="form.type = 'spend'"
              :class="[
                'toggle-button',
                'toggle-saida',
                form.type === 'spend' ? 'toggle-active' : ''
              ]"
            >
              <i class="pi pi-arrow-down mr-2"></i>
              Saída
            </button>
          </div>
        </div>

        <!-- Data -->
        <div class="form-group">
          <label class="form-label">Data *</label>
          <DatePicker
            v-model="calendarDate"
            dateFormat="dd/mm/yy"
            appendTo="body"
            :showIcon="true"
            class="w-full"
            :class="{ 'p-invalid': errors.date }"
          />
          <small v-if="errors.date" class="p-error">{{ errors.date }}</small>
        </div>

        <!-- Valor -->
        <div class="form-group">
          <label class="form-label">Valor *</label>
          <InputNumber
            v-model="form.amount"
            mode="currency"
            currency="BRL"
            locale="pt-BR"
            class="w-full"
            :class="{ 'p-invalid': errors.amount }"
            :min="0"
            :maxFractionDigits="2"
          />
          <small v-if="errors.amount" class="p-error">{{ errors.amount }}</small>
        </div>

        <!-- Categoria -->
        <div class="form-group">
          <label class="form-label">Categoria *</label>
          <Select
            v-model="form.category_id"
            :options="filteredCategories"
            optionLabel="name"
            optionValue="id"
            placeholder="Selecione uma categoria"
            class="w-full"
            :class="{ 'p-invalid': errors.category_id }"
            @change="onCategoryChange"
          />
          <small v-if="errors.category_id" class="p-error">{{ errors.category_id }}</small>
        </div>

        <!-- Subcategoria -->
        <div class="form-group">
          <label class="form-label">Subcategoria</label>
          <Select
            v-model="form.subcategory_id"
            :options="availableSubcategories"
            optionLabel="name"
            optionValue="id"
            placeholder="Selecione uma subcategoria (opcional)"
            class="w-full"
            :disabled="!form.category_id"
          />
        </div>

        <!-- Meio de Pagamento -->
        <div class="form-group">
          <label class="form-label">Meio de Pagamento *</label>
          <Select
            v-model="form.payment_method_id"
            :options="filterOptions.meiosPagamento"
            optionLabel="label"
            optionValue="id"
            placeholder="Selecione um meio de pagamento"
            class="w-full"
            :class="{ 'p-invalid': errors.payment_method_id }"
          />
          <small v-if="errors.payment_method_id" class="p-error">{{ errors.payment_method_id }}</small>
        </div>

        <!-- Banco -->
        <div class="form-group">
          <label class="form-label">Banco *</label>
          <Select
            v-model="form.bank_id"
            :options="filterOptions.bancos"
            optionLabel="name"
            optionValue="id"
            placeholder="Selecione um banco"
            class="w-full"
            :class="{ 'p-invalid': errors.bank_id }"
          />
          <small v-if="errors.bank_id" class="p-error">{{ errors.bank_id }}</small>
        </div>

        <!-- Descrição -->
        <div class="form-group">
          <label class="form-label">Descrição</label>
          <Textarea
            v-model="form.description"
            placeholder="Descrição da transação (opcional)"
            class="w-full"
            rows="3"
          />
        </div>

        <!-- Botões -->
        <div class="modal-actions">
          <Button
            label="Cancelar"
            severity="secondary"
            @click="$emit('close')"
            class="mr-3"
          />
          <Button
            :label="isEditing ? 'Atualizar' : 'Criar'"
            :icon="isEditing ? 'pi pi-check' : 'pi pi-plus'"
            :loading="loading"
            @click="handleSubmit"
          />
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useDashboardStore } from '@/stores/useDashboardStore'
import type { TransactionCreateDTO } from '@/types'

interface Props {
  visible: boolean
  editingTransaction?: any
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  saved: []
}>()

const store = useDashboardStore()
const loading = ref(false)

// Form data
const today = new Date()
const year = today.getFullYear()
const month = String(today.getMonth() + 1).padStart(2, '0')
const day = String(today.getDate()).padStart(2, '0')
const todayString = `${year}-${month}-${day}`

const form = ref<TransactionCreateDTO>({
  date: todayString,
  amount: 0,
  type: 'spend',
  category_id: 0,
  subcategory_id: undefined,
  payment_method_id: 0,
  bank_id: 0,
  description: '',
  merchant: ''
})

// Computed para converter data para o formato correto do Calendar
const calendarDate = computed({
  get: () => {
    if (!form.value.date) return null
    // Converter string ISO para Date object, ajustando timezone
    const date = new Date(form.value.date + 'T00:00:00')
    return date
  },
  set: (value: Date | null) => {
    if (value) {
      // Converter Date object para string ISO, ajustando timezone
      const year = value.getFullYear()
      const month = String(value.getMonth() + 1).padStart(2, '0')
      const day = String(value.getDate()).padStart(2, '0')
      form.value.date = `${year}-${month}-${day}`
    }
  }
})

// Errors
const errors = ref<Record<string, string>>({})

// Computed
const isEditing = computed(() => !!props.editingTransaction)
const filterOptions = computed(() => store.filterOptions)

const filteredCategories = computed(() => {
  const type = form.value.type
  if (type === 'income') {
    // Entradas: apenas categorias do tipo 'income'
    return filterOptions.value.categorias.filter(c => ["income","transfer"].includes(c.kind) && c.id !== 502)
  } else {
    // Saídas: categorias dos tipos 'spend', 'fee', 'transfer', 'invest'
    return filterOptions.value.categorias.filter(c => 
      ['spend', 'fee', 'transfer', 'invest'].includes(c.kind)
    )
  }
})

const availableSubcategories = computed(() => {
  if (!form.value.category_id) return []
  const selectedCategory = filterOptions.value.categorias.find(c => c.id === form.value.category_id)
  if (!selectedCategory) return []
  
  // Filtrar subcategorias pela categoria pai e mesmo tipo
  return filterOptions.value.subcategorias.filter(sub => 
    sub.parentId === form.value.category_id && sub.kind === selectedCategory.kind
  )
})

// Methods
const resetForm = () => {
  // Corrigir problema de timezone para data atual
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const todayString = `${year}-${month}-${day}`
  
  form.value = {
    date: todayString,
    amount: 0,
    type: 'spend',
    category_id: 0,
    subcategory_id: undefined,
    payment_method_id: 0,
    bank_id: 0,
    description: '',
    merchant: ''
  }
  errors.value = {}
}

const validateForm = () => {
  errors.value = {}
  
  if (!form.value.date) {
    errors.value.date = 'Data é obrigatória'
  }
  
  if (!form.value.amount || form.value.amount <= 0) {
    errors.value.amount = 'Valor deve ser maior que zero'
  }
  
  if (!form.value.category_id) {
    errors.value.category_id = 'Categoria é obrigatória'
  }
  
  if (!form.value.payment_method_id) {
    errors.value.payment_method_id = 'Meio de pagamento é obrigatório'
  }
  
  if (!form.value.bank_id) {
    errors.value.bank_id = 'Banco é obrigatório'
  }
  
  return Object.keys(errors.value).length === 0
}

const onCategoryChange = () => {
  // Limpar subcategoria quando categoria muda
  form.value.subcategory_id = undefined
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    if (isEditing.value) {
      await store.updateTransaction(props.editingTransaction.id, form.value)
    } else {
      await store.createTransaction(form.value)
    }
    
    emit('saved')
    resetForm()
  } catch (error: any) {
    console.error('Erro ao salvar transação:', error)
    // Aqui você pode adicionar um toast de erro
  } finally {
    loading.value = false
  }
}

// Watchers
watch(() => props.visible, (newVisible) => {
  if (newVisible && props.editingTransaction) {
    // Preencher formulário com dados da transação
    form.value = {
      date: props.editingTransaction.date || todayString,
      amount: props.editingTransaction.amount || 0,
      type: props.editingTransaction.type || 'spend',
      category_id: props.editingTransaction.category_id || 0,
      subcategory_id: props.editingTransaction.subcategory_id,
      payment_method_id: props.editingTransaction.payment_method_id || 0,
      bank_id: props.editingTransaction.bank_id || 0,
      description: props.editingTransaction.description || '',
      merchant: props.editingTransaction.merchant || ''
    }
  } else if (newVisible && !props.editingTransaction) {
    resetForm()
  } else if (!newVisible) {
    resetForm()
  }
})

// Watcher específico para editingTransaction
watch(() => props.editingTransaction, (newTransaction) => {
  if (newTransaction && props.visible) {
    form.value = {
      date: newTransaction.date || todayString,
      amount: newTransaction.amount || 0,
      type: newTransaction.type || 'spend',
      category_id: newTransaction.category_id || 0,
      subcategory_id: newTransaction.subcategory_id,
      payment_method_id: newTransaction.payment_method_id || 0,
      bank_id: newTransaction.bank_id || 0,
      description: newTransaction.description || '',
      merchant: newTransaction.merchant || ''
    }
  }
}, { immediate: true })

watch(() => form.value.type, () => {
  // Limpar categoria e subcategoria ao trocar tipo
  form.value.category_id = 0
  form.value.subcategory_id = undefined
})

onMounted(async () => {
  // Carregar opções de filtro se não estiverem carregadas
  if (filterOptions.value.categorias.length === 0) {
    try {
      await store.loadFilterOptions()
    } catch (error) {
      console.error('Erro ao carregar opções de filtro:', error)
    }
  }
})
</script>

<style scoped>
.transaction-modal {
  @apply bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4;
  @apply backdrop-blur-sm bg-opacity-95;
  @apply border border-gray-200 dark:border-gray-700;
  @apply shadow-2xl;
}

.modal-header {
  @apply flex items-center justify-between mb-6;
}

.modal-content {
  @apply space-y-4;
}

.form-group {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.toggle-container {
  @apply flex gap-2;
}

.toggle-button {
  @apply flex-1 py-3 px-4 rounded-lg font-medium;
  @apply transition-all duration-200;
  @apply border-2;
  @apply flex items-center justify-center;
}

.toggle-entrada {
  @apply border-green-200 text-green-700 bg-green-50;
}

.toggle-entrada.toggle-active {
  @apply border-green-500 bg-green-500 text-white;
}

.toggle-saida {
  @apply border-red-200 text-red-700 bg-red-50;
}

.toggle-saida.toggle-active {
  @apply border-red-500 bg-red-500 text-white;
}

.modal-actions {
  @apply flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700;
}

/* Responsivo */
@media (max-width: 640px) {
  .transaction-modal {
    @apply mx-2 p-4;
  }
  
  .toggle-container {
    @apply flex-col;
  }
  
  .toggle-button {
    @apply w-full;
  }
}
</style>

