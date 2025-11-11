import { describe, it, expect, beforeEach } from "vitest";
import { createApp } from "../src/app.js";

describe("Dashboard endpoints", () => {
  let app: any;

  beforeEach(async () => {
    app = await createApp();

    // Inserir dados de teste
    const transacoes = [
      {
        data: "2025-01-01",
        descricao_original: "Transferência interna",
        estabelecimento: "Internal Transfer",
        tipo: "debito",
        valor: -100.0,
        categoria: "Transferências",
        subcategoria: "Transferência interna",
        observacoes: "transferência interna",
      },
      {
        data: "2025-01-01",
        descricao_original: "Pagamento fatura cartão",
        estabelecimento: "Credit Card",
        tipo: "debito",
        valor: -500.0,
        categoria: "Cartão de Crédito",
        subcategoria: "Pagamento de fatura",
      },
      {
        data: "2025-01-01",
        descricao_original: "Aporte investimento",
        estabelecimento: "Investment",
        tipo: "debito",
        valor: -200.0,
        categoria: "Investimentos",
        subcategoria: "Aporte",
      },
      {
        data: "2025-01-01",
        descricao_original: "Rendimento investimento",
        estabelecimento: "Investment",
        tipo: "credito",
        valor: 50.0,
        categoria: "Investimentos",
        subcategoria: "Rendimentos",
      },
      {
        data: "2025-01-01",
        descricao_original: "Compra supermercado",
        estabelecimento: "Supermarket",
        tipo: "debito",
        valor: -80.0,
        categoria: "Alimentação",
        subcategoria: "Supermercado",
      },
      {
        data: "2025-01-01",
        descricao_original: "Salário",
        estabelecimento: "Company",
        tipo: "credito",
        valor: 3000.0,
        categoria: "Renda",
        subcategoria: "Salário",
      },
    ];

    await app.inject({
      method: "POST",
      url: "/statements/ingest",
      headers: {
        "x-api-key": "changeme",
      },
      payload: {
        userId: 1,
        periodStart: "2025-01-01",
        periodEnd: "2025-01-31",
        sourceFile: "test.csv",
        transacoes,
      },
    });
  });

  it("should apply exclusions in overview", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/dash/overview?userId=1&from=2025-01-01&to=2025-01-31",
    });

    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.body);

    // Deve excluir:
    // - Transferência interna (100)
    // - Pagamento de fatura (500)
    // - Aporte investimento (200) - vai para investimentosAportes
    // Deve incluir:
    // - Supermercado (80) como gasto
    // - Salário (3000) como entrada
    // - Rendimento investimento (50) como entrada
    expect(result.totalSaidas).toBe(80); // Apenas supermercado
    expect(result.totalEntradas).toBe(3050); // Salário + rendimento
    expect(result.saldoFinalEstimado).toBe(2970); // 3050 - 80
    expect(result.investimentosAportes).toBe(200); // Aporte investimento
    expect(result.tarifas).toBe(0); // Nenhuma tarifa nos dados de teste
  });

  it("should return category breakdown", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/dash/by-category?userId=1&from=2025-01-01&to=2025-01-31",
    });

    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.body);

    // Deve ter apenas as categorias não excluídas
    const categories = result.map((r: any) => r.categoria);
    expect(categories).toContain("Alimentação");
    expect(categories).toContain("Renda");
    expect(categories).toContain("Investimentos"); // Rendimentos devem aparecer
    expect(categories).not.toContain("Transferências");
    expect(categories).not.toContain("Cartão de Crédito");
  });

  it("should return time series data", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/dash/series?userId=1&from=2025-01-01&to=2025-01-31&groupBy=day",
    });

    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.body);

    expect(result.seriesEntradas).toBeDefined();
    expect(result.seriesSaidas).toBeDefined();
    expect(Array.isArray(result.seriesEntradas)).toBe(true);
    expect(Array.isArray(result.seriesSaidas)).toBe(true);
  });

  it("should return top subcategories", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/dash/top-subcategories?userId=1&from=2025-01-01&to=2025-01-31",
    });

    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.body);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeLessThanOrEqual(10);

    // Deve ter apenas subcategorias de gastos de consumo
    const subcategories = result.map((r: any) => r.subcategoria);
    expect(subcategories).toContain("Supermercado");
    expect(subcategories).not.toContain("Transferência interna");
    expect(subcategories).not.toContain("Pagamento de fatura");
    expect(subcategories).not.toContain("Aporte");
  });
});
