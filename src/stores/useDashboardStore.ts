import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import type {
  ExcelData,
  Filters,
  KPIs,
  SeriesData,
  TopSubcategory,
} from "@/types";
import { api } from "@/utils/api";

export const useDashboardStore = defineStore("dashboard", () => {
  // State
  const data = ref<ExcelData | null>(null);
  const loading = ref(false);
  const fileName = ref("");
  const useApi = ref(false); // Toggle entre API e Excel local
  const apiError = ref<string | null>(null);

  const filters = ref<Filters>({
    periodo: null,
    categorias: [],
    subcategorias: [],
    meiosPagamento: [],
    buscaTexto: "",
  });

  const selectedTrendPeriod = ref<"day" | "week" | "month">("day");

  // State para opções de filtro
  const filterOptions = ref({
    categorias: [] as Array<{
      id: number;
      name: string;
      parentId?: number;
      kind: string;
    }>,
    subcategorias: [] as Array<{
      id: number;
      name: string;
      parentId: number;
      kind: string;
    }>,
    meiosPagamento: [] as Array<{ id: number; label: string; code: string }>,
    bancos: [] as Array<{ id: number; code: string; name: string }>,
  });

  // Helper para converter filtros do frontend em parâmetros de API
  const buildApiFilters = () => {
    const apiFilters: any = { userId: 1 };

    // Período
    if (filters.value.periodo && filters.value.periodo.length === 2) {
      const [startDate, endDate] = filters.value.periodo;
      apiFilters.from = startDate.toISOString().split("T")[0];
      apiFilters.to = endDate.toISOString().split("T")[0];
    }

    // Categorias - ENVIAR IDs
    if (filters.value.categorias.length > 0) {
      apiFilters.categoryIds = filters.value.categorias.join(",");
    }

    // Subcategorias - ENVIAR IDs
    if (filters.value.subcategorias.length > 0) {
      apiFilters.subcategoryIds = filters.value.subcategorias.join(",");
    }

    // Meios de Pagamento - ENVIAR IDs
    if (filters.value.meiosPagamento.length > 0) {
      apiFilters.paymentMethodIds = filters.value.meiosPagamento.join(",");
    }

    // Busca textual
    if (filters.value.buscaTexto) {
      apiFilters.q = filters.value.buscaTexto;
    }

    return apiFilters;
  };

  // Função para carregar opções de filtro
  const loadFilterOptions = async () => {
    try {
      const [categories, paymentMethods, banks] = await Promise.all([
        api.getCategories(),
        api.getPaymentMethods(),
        api.getBanks(),
      ]);

      // Separar categorias e subcategorias
      const categoriesData = categories as any;
      const paymentMethodsData = paymentMethods as any;
      const banksData = banks as any;

      filterOptions.value.categorias = categoriesData.items.filter(
        (c: any) => !c.parentId,
      );
      filterOptions.value.subcategorias = categoriesData.items.filter(
        (c: any) => c.parentId,
      );
      filterOptions.value.meiosPagamento =
        paymentMethodsData.items || paymentMethodsData;
      filterOptions.value.bancos = banksData.items || banksData;
    } catch (error) {
      console.error("Erro ao carregar opções de filtro:", error);
    }
  };

  // Carregar opções de filtro quando o modo API for ativado
  watch(useApi, (newValue: boolean) => {
    if (newValue) {
      loadFilterOptions();
    }
  });

  // Getters
  const hasData = computed(() => data.value !== null);

  const filteredTransactions = computed(() => {
    if (!data.value) return [];

    // Se usando API, dados já vêm filtrados do backend
    if (useApi.value) {
      return data.value.transacoes || [];
    }

    // Caso contrário (modo Excel), aplicar filtros localmente
    let transactions = data.value.transacoes || [];

    // Aplicar filtros
    if (filters.value.periodo && filters.value.periodo.length === 2) {
      const [startDate, endDate] = filters.value.periodo;
      transactions = transactions.filter((t) => {
        const transactionDate = new Date(t.data);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    }

    if (filters.value.categorias.length > 0) {
      transactions = transactions.filter((t) =>
        filters.value.categorias.includes(t.categoria),
      );
    }

    if (filters.value.subcategorias.length > 0) {
      transactions = transactions.filter((t) =>
        filters.value.subcategorias.includes(t.subcategoria),
      );
    }

    if (filters.value.meiosPagamento.length > 0) {
      transactions = transactions.filter((t) =>
        filters.value.meiosPagamento.includes(t.meio_pagamento),
      );
    }

    if (filters.value.buscaTexto) {
      const searchTerm = filters.value.buscaTexto.toLowerCase();
      transactions = transactions.filter(
        (t) =>
          t.descricao_original.toLowerCase().includes(searchTerm) ||
          t.estabelecimento.toLowerCase().includes(searchTerm) ||
          t.observacoes.toLowerCase().includes(searchTerm),
      );
    }

    return transactions;
  });

  const eligibleExpenses = computed(() => {
    // Se usando API, dados já vêm filtrados do backend
    if (useApi.value) {
      return filteredTransactions.value.filter((t) => t.type === "spend");
    }

    // Caso contrário (modo Excel), aplicar filtros locais
    return filteredTransactions.value.filter((t) => {
      if (t.tipo !== "debito") return false;

      // Excluir transferências internas
      if (
        t.categoria === "Transferências" &&
        (t.subcategoria === "Transferência interna" ||
          t.observacoes.includes("transferência interna"))
      ) {
        return false;
      }

      // Excluir pagamentos de fatura de cartão
      if (
        t.categoria === "Cartão de Crédito" &&
        t.subcategoria === "Pagamento de fatura"
      ) {
        return false;
      }

      return true;
    });
  });

  const eligibleIncomes = computed(() => {
    // Se usando API, dados já vêm filtrados do backend
    if (useApi.value) {
      return filteredTransactions.value.filter((t) => t.type === "income");
    }

    // Caso contrário (modo Excel), aplicar filtros locais
    return filteredTransactions.value.filter((t) => {
      if (t.tipo !== "credito") return false;

      // Excluir transferências internas
      if (
        t.categoria === "Transferências" &&
        (t.subcategoria === "Transferência interna" ||
          t.observacoes.includes("transferência interna"))
      ) {
        return false;
      }

      return true;
    });
  });

  const kpis = computed((): KPIs => {
    // Se estiver usando API, usar dados do overview
    if (useApi.value && data.value?.visaoGeral) {
      return {
        entradas: data.value.visaoGeral.total_entradas || 0,
        saidas: data.value.visaoGeral.total_saidas || 0,
        saldo: data.value.visaoGeral.saldo_final_estimado || 0,
        tarifas: data.value.visaoGeral.tarifas || 0,
        investimentosAportes: data.value.visaoGeral.investimentos_aportes || 0,
      };
    }

    // Fallback: calcular localmente (modo Excel)
    const entradas = eligibleIncomes.value.reduce((sum, t) => sum + t.valor, 0);
    const saidas = eligibleExpenses.value.reduce(
      (sum, t) => sum + Math.abs(t.valor),
      0,
    );
    const saldo = entradas - saidas;

    // Calcular tarifas da categoria "Serviços financeiros"
    const tarifas = filteredTransactions.value
      .filter(
        (t) =>
          t.categoria === "Serviços financeiros" &&
          t.subcategoria === "Tarifas",
      )
      .reduce((sum, t) => sum + Math.abs(t.valor), 0);

    // Calcular investimentos (aportes) - tipo='debito' e categoria de investimento
    const investimentosAportes = filteredTransactions.value
      .filter(
        (t) =>
          t.tipo === "debito" &&
          t.categoria === "Investimentos" &&
          t.subcategoria === "Aporte",
      )
      .reduce((sum, t) => sum + Math.abs(t.valor), 0);

    return { entradas, saidas, saldo, tarifas, investimentosAportes };
  });

  const chartCategoryData = computed(() => {
    if (!data.value) return { labels: [], datasets: [] };

    // Se estiver usando API, usar dados do resumoPorCategoria
    if (useApi.value && data.value?.resumoPorCategoria) {
      return {
        labels: data.value.resumoPorCategoria.map((cat: any) => cat.categoria),
        datasets: [
          {
            label: "Gastos por Categoria",
            data: data.value.resumoPorCategoria.map((cat: any) => cat.total),
            backgroundColor: [
              "#2563eb",
              "#10b981",
              "#f59e0b",
              "#ef4444",
              "#8b5cf6",
              "#06b6d4",
              "#84cc16",
              "#f97316",
              "#ec4899",
              "#6b7280",
            ],
          },
        ],
      };
    }

    // Fallback: calcular localmente (modo Excel)
    const categoryTotals = eligibleExpenses.value.reduce(
      (acc, t) => {
        const category = t.categoria || "Outros";
        acc[category] = (acc[category] || 0) + Math.abs(t.valor);
        return acc;
      },
      {} as Record<string, number>,
    );

    const labels = Object.keys(categoryTotals);
    const values = Object.values(categoryTotals);

    return {
      labels,
      datasets: [
        {
          label: "Gastos por Categoria",
          data: values,
          backgroundColor: [
            "#2563eb",
            "#10b981",
            "#f59e0b",
            "#ef4444",
            "#8b5cf6",
            "#06b6d4",
            "#84cc16",
            "#f97316",
            "#ec4899",
            "#6b7280",
          ],
        },
      ],
    };
  });

  const topSubcategoriesData = computed(() => {
    if (!data.value) return [];

    // Se estiver usando API, usar dados do endpoint dedicado
    if (useApi.value && data.value?.topSubcategories) {
      return data.value.topSubcategories;
    }

    // Fallback: calcular localmente (modo Excel)
    const subcategoryTotals = eligibleExpenses.value.reduce(
      (acc, t) => {
        const subcategory = t.subcategoria || "Outros";
        const categoria = t.categoria || "Sem categoria";
        if (!acc[subcategory]) {
          acc[subcategory] = { subcategoria: subcategory, categoria, total: 0 };
        }
        acc[subcategory].total += Math.abs(t.valor);
        return acc;
      },
      {} as Record<
        string,
        { subcategoria: string; categoria: string; total: number }
      >,
    );

    return Object.values(subcategoryTotals)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  });

  const chartSubcategoryData = computed(() => {
    if (!data.value) return { labels: [], datasets: [] };

    const topSubcategories = topSubcategoriesData.value;

    const labels = topSubcategories.map((item) => item.subcategoria);
    const values = topSubcategories.map((item) => item.total);

    return {
      labels,
      datasets: [
        {
          label: "Top 10 Subcategorias",
          data: values,
          backgroundColor: "#2563eb",
        },
      ],
    };
  });

  const chartTrendData = computed(() => {
    if (!data.value) return { labels: [], datasets: [] };

    // Se estiver usando API, usar dados da API
    if (useApi.value && data.value?.seriesData) {
      const seriesData = data.value.seriesData;

      // Verificar se é o formato da API (SeriesData) ou formato Excel (Array)
      if ("seriesEntradas" in seriesData && "seriesSaidas" in seriesData) {
        const apiSeriesData = seriesData as SeriesData;

        // Processar dados da API (formato: { seriesEntradas: [{x, y}], seriesSaidas: [{x, y}] })
        const entradas = apiSeriesData.seriesEntradas || [];
        const saidas = apiSeriesData.seriesSaidas || [];

        // Combinar e ordenar por data
        const allDates = [
          ...new Set([
            ...entradas.map((item: any) => item.x),
            ...saidas.map((item: any) => item.x),
          ]),
        ].sort();

        // Criar mapas para acesso rápido
        const entradasMap = new Map(
          entradas.map((item: any) => [item.x, item.y]),
        );
        const saidasMap = new Map(saidas.map((item: any) => [item.x, item.y]));

        // Formatar labels baseado no período
        const formatLabel = (dateStr: string) => {
          if (selectedTrendPeriod.value === "day") {
            return new Date(dateStr).toLocaleDateString("pt-BR");
          } else if (selectedTrendPeriod.value === "week") {
            return `Semana ${dateStr}`;
          } else {
            // month
            return new Date(dateStr).toLocaleDateString("pt-BR", {
              month: "long",
              year: "numeric",
            });
          }
        };

        return {
          labels: allDates.map(formatLabel),
          datasets: [
            {
              label: "Entradas",
              data: allDates.map((date) => entradasMap.get(date) || 0),
              borderColor: "#10b981",
              backgroundColor: "rgba(16, 185, 129, 0.2)",
              tension: 0.4,
            },
            {
              label: "Saídas",
              data: allDates.map((date) => saidasMap.get(date) || 0),
              borderColor: "#ef4444",
              backgroundColor: "rgba(239, 68, 68, 0.2)",
              tension: 0.4,
            },
          ],
        };
      }
    }

    // Fallback: calcular localmente (modo Excel)
    const transactions = filteredTransactions.value;

    // Função para agrupar por período
    const groupByPeriod = (
      transactions: any[],
      period: "day" | "week" | "month",
    ) => {
      const grouped = transactions.reduce(
        (acc, t) => {
          let key: string;

          if (period === "day") {
            key = t.data;
          } else if (period === "week") {
            const date = new Date(t.data);
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - date.getDay());
            key = startOfWeek.toISOString().split("T")[0];
          } else {
            // month
            const date = new Date(t.data);
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          }

          if (!acc[key]) {
            acc[key] = { entradas: 0, saidas: 0 };
          }

          if (t.tipo === "credito") {
            acc[key].entradas += t.valor;
          } else {
            acc[key].saidas += Math.abs(t.valor);
          }

          return acc;
        },
        {} as Record<string, { entradas: number; saidas: number }>,
      );

      return grouped;
    };

    const periodTotals = groupByPeriod(transactions, selectedTrendPeriod.value);

    // Ordenar as chaves
    const sortedKeys = Object.keys(periodTotals).sort();

    // Formatar labels baseado no período
    const formatLabel = (key: string) => {
      if (selectedTrendPeriod.value === "day") {
        return key;
      } else if (selectedTrendPeriod.value === "week") {
        const date = new Date(key);
        const endOfWeek = new Date(date);
        endOfWeek.setDate(date.getDate() + 6);
        return `${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} - ${endOfWeek.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;
      } else {
        // month
        const [year, month] = key.split("-");
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(
          "pt-BR",
          { month: "long", year: "numeric" },
        );
      }
    };

    const labels = sortedKeys.map(formatLabel);
    const entradas = sortedKeys.map((key) => periodTotals[key].entradas);
    const saidas = sortedKeys.map((key) => periodTotals[key].saidas);

    return {
      labels,
      datasets: [
        {
          label: "Entradas",
          data: entradas,
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.2)",
          tension: 0.4,
        },
        {
          label: "Saídas",
          data: saidas,
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.2)",
          tension: 0.4,
        },
      ],
    };
  });

  const availableCategories = computed(() => {
    if (!data.value) return [];
    const categories = new Set(
      data.value.transacoes.map((t) => t.categoria).filter(Boolean),
    );
    return Array.from(categories).sort();
  });

  const availableSubcategories = computed(() => {
    if (!data.value) return [];
    const subcategories = new Set(
      data.value.transacoes.map((t) => t.subcategoria).filter(Boolean),
    );
    return Array.from(subcategories).sort();
  });

  const availableMeiosPagamento = computed(() => {
    if (!data.value) return [];
    const meios = new Set(
      data.value.transacoes.map((t) => t.meio_pagamento).filter(Boolean),
    );
    return Array.from(meios).sort();
  });

  const dateRange = computed(() => {
    return null;
  });

  // Actions
  const setData = (newData: ExcelData, name: string) => {
    data.value = newData;
    fileName.value = name;
    resetFilters();
  };

  const setLoading = (value: boolean) => {
    loading.value = value;
  };

  const updateFilters = (newFilters: Partial<Filters>) => {
    filters.value = { ...filters.value, ...newFilters };
  };

  const resetFilters = () => {
    filters.value = {
      periodo: null,
      categorias: [],
      subcategorias: [],
      meiosPagamento: [],
      buscaTexto: "",
    };
  };

  const clearData = () => {
    data.value = null;
    fileName.value = "";
    resetFilters();
  };

  const setTrendPeriod = async (period: "day" | "week" | "month") => {
    selectedTrendPeriod.value = period;

    // Se estiver usando API, recarregar dados com o novo período
    if (useApi.value) {
      await fetchSeriesFromApi();
    }
  };

  const fetchSeriesFromApi = async () => {
    if (!useApi.value) return;

    try {
      const series = (await api.getSeries({
        userId: 1,
        groupBy: selectedTrendPeriod.value,
      })) as SeriesData;

      if (data.value) {
        data.value.seriesData = series;
      }
    } catch (error: any) {
      console.error("Erro ao buscar dados de série:", error);
      apiError.value = error.message || "Erro ao buscar dados de série";
    }
  };

  // API Actions
  const fetchFromApi = async () => {
    if (!useApi.value) return;

    loading.value = true;
    apiError.value = null;

    try {
      // Verificar se API está disponível
      await api.health();

      // Buscar transações completas
      const transactionsResult = await api.getTransactions({
        userId: 1,
        page: 1,
        pageSize: 100, // Buscar até 100 transações por vez
      });

      console.log("transactionsResult", transactionsResult);

      // Buscar dados agregados do dashboard
      const [overview, byCategory, series, topSubcategories] =
        (await Promise.all([
          api.getOverview({ userId: 1 }),
          api.getByCategory({ userId: 1 }),
          api.getSeries({ userId: 1, groupBy: selectedTrendPeriod.value }),
          api.getTopSubcategories({ userId: 1 }),
        ])) as [any, any, SeriesData, TopSubcategory[]];

      // Montar estrutura ExcelData completa
      const apiData: ExcelData = {
        transacoes: (transactionsResult as any).items || [],
        resumoPorCategoria: byCategory.map((cat: any) => ({
          categoria: cat.categoria,
          subcategoria: cat.subcategoria,
          qtd_transacoes: cat.qty,
          total: cat.total,
          ticket_medio: cat.ticketMedio,
        })),
        visaoGeral: {
          total_entradas: overview.totalEntradas,
          total_saidas: overview.totalSaidas,
          saldo_final_estimado: overview.saldoFinalEstimado,
          tarifas: overview.tarifas,
          investimentos_aportes: overview.investimentosAportes,
        },
        seriesData: series.seriesEntradas.map((item: any, index: number) => ({
          x: item.x,
          entradas: item.y,
          saidas: series.seriesSaidas[index]?.y || 0,
        })),
        topSubcategories: topSubcategories || [],
      };

      data.value = apiData;
      fileName.value = "API Backend";
    } catch (error: any) {
      apiError.value = error.message;
      console.error("Erro ao buscar dados da API:", error);
    } finally {
      loading.value = false;
    }
  };

  // Carregar dados da API automaticamente
  const loadFromApi = async () => {
    useApi.value = true;
    await fetchFromApi();
  };

  // Carregar dados da API com filtros específicos
  const fetchFromApiWithFilters = async () => {
    if (!useApi.value) return;

    loading.value = true;
    apiError.value = null;

    try {
      const apiFilters = buildApiFilters();

      // Buscar dados agregados COM FILTROS
      const [
        overview,
        byCategory,
        series,
        topSubcategories,
        transactionsResult,
      ] = (await Promise.all([
        api.getOverview(apiFilters),
        api.getByCategory(apiFilters),
        api.getSeries({ ...apiFilters, groupBy: selectedTrendPeriod.value }),
        api.getTopSubcategories(apiFilters),
        api.getTransactions({ ...apiFilters, page: 1, pageSize: 100 }),
      ])) as [any, any, SeriesData, TopSubcategory[], any];

      // Atualizar TODOS os dados (não só agregados)
      if (data.value) {
        data.value.transacoes = transactionsResult.items || [];
        data.value.visaoGeral = {
          total_entradas: overview.totalEntradas,
          total_saidas: overview.totalSaidas,
          saldo_final_estimado: overview.saldoFinalEstimado,
          tarifas: overview.tarifas,
          investimentos_aportes: overview.investimentosAportes,
        };
        data.value.resumoPorCategoria = byCategory.map((cat: any) => ({
          categoria: cat.categoria,
          subcategoria: cat.subcategoria,
          qtd_transacoes: cat.qty,
          total: cat.total,
          ticket_medio: cat.ticketMedio,
        }));
        data.value.seriesData = series;
        data.value.topSubcategories = topSubcategories || [];
      }
    } catch (error: any) {
      apiError.value = error.message;
      console.error("Erro ao buscar dados filtrados da API:", error);
    } finally {
      loading.value = false;
    }
  };

  // Verificar se API está disponível
  const checkApiHealth = async () => {
    try {
      await api.health();
      return true;
    } catch {
      return false;
    }
  };

  const fetchTransactions = async (filters: any = {}) => {
    if (!useApi.value) return [];

    try {
      const result = (await api.getTransactions({
        userId: 1,
        ...filters,
      })) as any;
      return result.items || [];
    } catch (error: any) {
      console.error("Erro ao buscar transações:", error);
      return [];
    }
  };

  const toggleApiMode = (enabled: boolean) => {
    useApi.value = enabled;
    if (enabled) {
      fetchFromApi();
    } else {
      clearData();
    }
  };

  // CRUD Actions
  const createTransaction = async (data: any) => {
    if (!useApi.value) {
      throw new Error("Modo API não está ativo");
    }

    try {
      await api.createTransaction(data);
      // Recarregar dados após criar
      await fetchFromApi();
    } catch (error: any) {
      console.error("Erro ao criar transação:", error);
      throw error;
    }
  };

  const updateTransaction = async (id: number, data: any) => {
    if (!useApi.value) {
      throw new Error("Modo API não está ativo");
    }

    try {
      await api.updateTransaction(id, data);
      // Recarregar dados após atualizar
      await fetchFromApi();
    } catch (error: any) {
      console.error("Erro ao atualizar transação:", error);
      throw error;
    }
  };

  const deleteTransaction = async (id: number) => {
    if (!useApi.value) {
      throw new Error("Modo API não está ativo");
    }

    try {
      await api.deleteTransaction(id);
      // Recarregar dados após excluir
      await fetchFromApi();
    } catch (error: any) {
      console.error("Erro ao excluir transação:", error);
      throw error;
    }
  };

  return {
    // State
    data,
    loading,
    fileName,
    filters,
    selectedTrendPeriod,
    useApi,
    apiError,

    // Getters
    hasData,
    filteredTransactions,
    eligibleExpenses,
    eligibleIncomes,
    kpis,
    chartCategoryData,
    chartSubcategoryData,
    topSubcategoriesData,
    chartTrendData,
    availableCategories,
    availableSubcategories,
    availableMeiosPagamento,
    dateRange,

    // Actions
    setData,
    setLoading,
    updateFilters,
    resetFilters,
    clearData,
    setTrendPeriod,

    // API Actions
    fetchFromApi,
    fetchFromApiWithFilters,
    fetchSeriesFromApi,
    fetchTransactions,
    toggleApiMode,
    loadFromApi,
    checkApiHealth,

    // Filter options
    filterOptions,
    loadFilterOptions,

    // CRUD Actions
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
});
