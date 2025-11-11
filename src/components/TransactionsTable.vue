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
      <div
        v-else-if="filteredTransactions.length === 0"
        class="text-center py-8"
      >
        <i
          class="pi pi-table text-4xl text-gray-400 dark:text-gray-600 mb-4"
        ></i>
        <p class="text-gray-600 dark:text-gray-400">
          Nenhuma transação encontrada
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-500">
          Ajuste os filtros ou carregue um arquivo
        </p>
      </div>
      <DataTable
        v-else
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
        <Column field="date" header="Data" :sortable="true">
          <template #body="{ data }">
            {{ formatDate(data.date) }}
          </template>
        </Column>

        <Column field="description" header="Descrição" :sortable="true">
          <template #body="{ data }">
            <div class="max-w-xs truncate" :title="data.description">
              {{ data.description }}
            </div>
          </template>
        </Column>

        <Column field="merchant" header="Estabelecimento" :sortable="true">
          <template #body="{ data }">
            <div class="max-w-xs truncate" :title="data.merchant">
              {{ data.merchant }}
            </div>
          </template>
        </Column>

        <Column field="type" header="Tipo" :sortable="true">
          <template #body="{ data }">
            <Badge
              :value="data.type === 'income' ? 'Entrada' : 'Saída'"
              :severity="data.type === 'income' ? 'success' : 'danger'"
            />
          </template>
        </Column>

        <Column field="amount" header="Valor" :sortable="true">
          <template #body="{ data }">
            <span
              :class="
                data.type === 'income'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              "
            >
              {{
                formatCurrency(
                  data.type === "income" ? data.amount : -Math.abs(data.amount),
                )
              }}
            </span>
          </template>
        </Column>

        <Column field="category" header="Categoria" :sortable="true">
          <template #body="{ data }">
            <Tag :value="data.category" severity="info" />
          </template>
        </Column>

        <Column field="subcategory" header="Subcategoria" :sortable="true">
          <template #body="{ data }">
            <span v-if="data.subcategory">{{ data.subcategory }}</span>
            <span v-else class="text-gray-400">-</span>
          </template>
        </Column>

        <Column field="payment_method" header="Meio" :sortable="true">
          <template #body="{ data }">
            <span v-if="data.payment_method">{{ data.payment_method }}</span>
            <span v-else class="text-gray-400">-</span>
          </template>
        </Column>

        <Column header="Ações" :sortable="false" style="width: 120px">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button
                icon="pi pi-pencil"
                severity="info"
                size="small"
                @click="handleEdit(data)"
                v-tooltip.top="'Editar'"
                class="!p-2"
              />
              <Button
                icon="pi pi-trash"
                severity="danger"
                size="small"
                @click="confirmDelete(data)"
                v-tooltip.top="'Excluir'"
                class="!p-2"
              />
            </div>
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
import { computed } from "vue";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { formatCurrency, formatDate } from "@/utils/format";
import { useConfirm } from "primevue/useconfirm";

const store = useDashboardStore();
const confirm = useConfirm();

const loading = computed(() => store.loading);
const filteredTransactions = computed(() => store.filteredTransactions);
console.log("filteredTransactions", filteredTransactions.value);
console.log("Primeira transação:", filteredTransactions.value[0]);

// Emits
const emit = defineEmits<{
  edit: [transaction: any];
}>();

const handleEdit = (transaction: any) => {
  emit("edit", transaction);
};

const confirmDelete = (transaction: any) => {
  if (confirm) {
    confirm.require({
      message: `Tem certeza que deseja excluir esta transação?`,
      header: "Confirmar Exclusão",
      icon: "pi pi-exclamation-triangle",
      rejectLabel: "Cancelar",
      acceptLabel: "Excluir",
      accept: async () => {
        try {
          await store.deleteTransaction(transaction.id);
        } catch (error) {
          console.error("Erro ao excluir transação:", error);
        }
      },
    });
  } else {
    // Fallback para quando o ConfirmationService não estiver disponível
    if (window.confirm("Tem certeza que deseja excluir esta transação?")) {
      store.deleteTransaction(transaction.id);
    }
  }
};

const exportCSV = () => {
  if (filteredTransactions.value.length === 0) return;

  const headers = [
    "Data",
    "Descrição",
    "Estabelecimento",
    "Tipo",
    "Valor",
    "Categoria",
    "Subcategoria",
    "Meio de Pagamento",
    "Confiança",
  ];

  const csvContent = [
    headers.join(","),
    ...filteredTransactions.value.map((t) =>
      [
        t.date,
        `"${t.description}"`,
        `"${t.merchant}"`,
        t.type === "income" ? "Entrada" : "Saída",
        t.type === "income" ? t.amount : -Math.abs(t.amount),
        `"${t.category}"`,
        `"${t.subcategory || ""}"`,
        `"${t.payment_method || ""}"`,
        Math.round((t as any).confianca_classificacao * 100),
      ].join(","),
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `transacoes_${new Date().toISOString().split("T")[0]}.csv`,
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>
