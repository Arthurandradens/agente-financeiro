import OpenAI from "openai";
import { config } from "../config/env";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ======== UTILS DE PARSE ========
function parseMoneyBR(str: string | null | undefined): number | null {
  if (str == null) return null;
  const s = String(str).trim().replace(/\./g, "").replace(",", ".");
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
}

function parseDateBRtoISO(dmy: string | null | undefined): string | null {
  if (!dmy) return null;
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(String(dmy).trim());
  if (!m) return null;
  const [, d, mth, y] = m;
  return `${y}-${mth}-${d}`;
}

function parseDateNubankToISO(
  dateStr: string | null | undefined,
): string | null {
  if (!dateStr) return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(dateStr).trim());
  if (!m) return null;
  const [, d, mth, y] = m;
  return `${y}-${mth}-${d}`;
}

function parseDateBradescoToISO(
  dateStr: string | null | undefined,
): string | null {
  if (!dateStr) return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(dateStr).trim());
  if (!m) return null;
  const [, d, mth, y] = m;
  return `${y}-${mth}-${d}`;
}

function detectCSVFormat(raw: string): "mercadopago" | "nubank" | "bradesco" {
  if (raw.includes("RELEASE_DATE;TRANSACTION_TYPE")) {
    return "mercadopago";
  } else if (raw.includes("Data,Valor,Identificador,Descrição")) {
    return "nubank";
  } else if (
    raw.includes("Data;Histórico;Docto.;Crédito (R$);Débito (R$);Saldo (R$)")
  ) {
    return "bradesco";
  }
  throw new Error(
    "Formato de CSV não reconhecido. Formatos suportados: Mercado Pago, Nubank, Bradesco",
  );
}

function detectHeaderIndex(lines: string[]): number {
  const headerRE =
    /^RELEASE_DATE;TRANSACTION_TYPE;REFERENCE_ID;TRANSACTION_NET_AMOUNT;PARTIAL_BALANCE/i;
  return lines.findIndex((l) => headerRE.test(l));
}

function parseCSVLikeNubankTabs(raw: string): any[] {
  const content = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = content.split("\n").filter((l) => l !== null);
  const headerIdx = detectHeaderIndex(lines);
  if (headerIdx < 0) {
    throw new Error(
      "Cabeçalho de transações não encontrado (linha com RELEASE_DATE ...).",
    );
  }
  const dataLines = lines.slice(headerIdx + 1).filter((l) => l.trim() !== "");
  const items: any[] = [];
  for (const line of dataLines) {
    const cols = line.split(";");
    if (cols.length < 5) continue;
    const [
      RELEASE_DATE,
      TRANSACTION_TYPE,
      REFERENCE_ID,
      TRANSACTION_NET_AMOUNT,
      PARTIAL_BALANCE,
    ] = cols;
    const valor = parseMoneyBR(TRANSACTION_NET_AMOUNT);
    items.push({
      RELEASE_DATE: parseDateBRtoISO(RELEASE_DATE),
      TRANSACTION_TYPE: TRANSACTION_TYPE?.trim(),
      REFERENCE_ID: (REFERENCE_ID ?? "").trim(),
      TRANSACTION_NET_AMOUNT: valor,
      PARTIAL_BALANCE: parseMoneyBR(PARTIAL_BALANCE),
      description: TRANSACTION_TYPE?.trim(),
      amount: valor,
      tipo: (valor ?? 0) >= 0 ? "income" : "spend",
    });
  }
  return items;
}

function parseCSVNubank(raw: string): any[] {
  const content = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = content.split("\n").filter((l) => l.trim() !== "");
  const dataLines = lines.slice(1);
  const items: any[] = [];

  for (const line of dataLines) {
    if (!line.trim()) continue;
    const parts = line.split(",");
    if (parts.length < 4) continue;

    const data = parts[0].trim();
    const valor = parts[1].trim();
    const identificador = parts[2].trim();
    const descricao = parts.slice(3).join(",").trim();

    const valorNum = parseFloat(valor);

    items.push({
      date: parseDateNubankToISO(data),
      description: descricao,
      amount: valorNum,
      tipo: valorNum >= 0 ? "income" : "spend",
      id_transacao: identificador,
      RELEASE_DATE: parseDateNubankToISO(data),
      TRANSACTION_TYPE: descricao,
      REFERENCE_ID: identificador,
      TRANSACTION_NET_AMOUNT: valorNum,
    });
  }

  return items;
}

function parseCSVBradesco(raw: string): any[] {
  const content = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = content.split("\n");
  const items: any[] = [];
  const headerPattern =
    /^Data;Histórico;Docto\.;Crédito \(R\$\);Débito \(R\$\);Saldo \(R\$\)/i;

  const headerIndices: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (headerPattern.test(lines[i])) {
      headerIndices.push(i);
    }
  }

  if (headerIndices.length === 0) {
    throw new Error(
      "Cabeçalho de transações não encontrado (linha com Data;Histórico;Docto...).",
    );
  }

  for (const headerIdx of headerIndices) {
    const dataLines = lines.slice(headerIdx + 1);

    for (const line of dataLines) {
      const trimmed = line.trim();

      if (headerPattern.test(trimmed) || trimmed.startsWith(";;Total;")) {
        break;
      }

      if (
        !trimmed ||
        trimmed.startsWith("Extrato de:") ||
        trimmed.startsWith("Filtro de resultados") ||
        trimmed.startsWith("Os dados acima") ||
        trimmed.startsWith("Últimos Lancamentos") ||
        !/^\d{2}\/\d{2}\/\d{4}/.test(trimmed)
      ) {
        continue;
      }

      const cols = trimmed.split(";");
      if (cols.length < 6) continue;

      const [data, historico, docto, credito, debito, saldo] = cols;

      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(data.trim())) {
        continue;
      }

      const valorCredito = parseMoneyBR(credito);
      const valorDebito = parseMoneyBR(debito);

      let valor: number | null = null;
      let tipo: string | null = null;

      if (valorCredito !== null && valorCredito !== 0) {
        valor = valorCredito;
        tipo = "income";
      } else if (valorDebito !== null && valorDebito !== 0) {
        valor = -Math.abs(valorDebito);
        tipo = "spend";
      } else {
        continue;
      }

      const dateISO = parseDateBradescoToISO(data);
      if (!dateISO) continue;

      items.push({
        date: dateISO,
        description: historico?.trim() || "",
        amount: valor,
        tipo: tipo,
        RELEASE_DATE: dateISO,
        TRANSACTION_TYPE: historico?.trim() || "",
        REFERENCE_ID: docto?.trim() || "",
        TRANSACTION_NET_AMOUNT: valor,
        PARTIAL_BALANCE: parseMoneyBR(saldo),
      });
    }
  }

  return items;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ======== OPENAI: STRUCTURED OUTPUTS ========
const responseFormat = {
  type: "json_schema" as const,
  json_schema: {
    name: "classificacao_extrato_db",
    strict: true,
    schema: {
      type: "object",
      properties: {
        transacoes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              date: { type: "string" },
              description: { type: "string" },
              amount: { type: "number" },
              type: { type: "string", enum: ["income", "spend"] },
              counterparty_normalized: { type: "string" },
              payment_method: { type: "string" },
              payment_method_id: { type: "integer" },
              bank_id: { type: "integer" },
              category_id: { type: "integer" },
              subcategory_id: { type: ["integer", "null"] },
              category_label: { type: "string" },
              subcategory_label: { type: ["string", "null"] },
              movement_kind: {
                type: "string",
                enum: ["spend", "income", "transfer", "invest", "fee"],
              },
              is_internal_transfer: { type: "integer" },
              is_card_bill_payment: { type: "integer" },
              is_investment_aporte: { type: "integer" },
              is_investment_rendimento: { type: "integer" },
            },
            required: [
              "date",
              "description",
              "amount",
              "type",
              "counterparty_normalized",
              "payment_method",
              "payment_method_id",
              "bank_id",
              "category_id",
              "subcategory_id",
              "category_label",
              "subcategory_label",
              "movement_kind",
              "is_internal_transfer",
              "is_card_bill_payment",
              "is_investment_aporte",
              "is_investment_rendimento",
            ],
            additionalProperties: false,
          },
        },
      },
      required: ["transacoes"],
      additionalProperties: false,
    },
  },
};

export class ClassificationService {
  private client: OpenAI;
  private batchSize: number;

  constructor(batchSize: number = 80) {
    if (!config.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY não configurada");
    }
    this.client = new OpenAI({ apiKey: config.OPENAI_API_KEY });
    this.batchSize = batchSize;
  }

  async classifyBatch(systemPrompt: string, batch: any[]): Promise<any[]> {
    // Ler rules.json da raiz do projeto
    const rulesPath = path.join(__dirname, "../../../rules.json");
    const rules = JSON.parse(fs.readFileSync(rulesPath, "utf8"));

    const userMsg = [
      `As regras de classificação são:`,
      JSON.stringify(rules, null, 2),
      `Classifique o seguinte lote de transações (JSON) conforme as regras do prompt de sistema.`,
      `Retorne no schema solicitado (apenas o JSON).`,
      `Lote com ${batch.length} itens:`,
      JSON.stringify(batch, null, 2),
    ].join("\n");

    const res = await this.client.chat.completions.create({
      model: config.OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMsg },
      ],
      response_format: responseFormat,
    });

    const out = res.choices?.[0]?.message?.content ?? null;
    if (!out) throw new Error("Resposta vazia do modelo.");

    let parsed: any;
    try {
      parsed = JSON.parse(out);
    } catch (e) {
      const m = out.match(/\{[\s\S]*\}$/);
      if (!m) throw new Error("Falha ao parsear JSON de saída do modelo.");
      parsed = JSON.parse(m[0]);
    }

    return parsed.transacoes || [];
  }

  async classifyCSV(
    csvContent: string,
    systemPrompt: string,
    bankId: number,
  ): Promise<any[]> {
    // Detectar formato
    const format = detectCSVFormat(csvContent);

    // Parsear CSV
    let transacoes: any[];
    if (format === "mercadopago") {
      transacoes = parseCSVLikeNubankTabs(csvContent);
    } else if (format === "nubank") {
      transacoes = parseCSVNubank(csvContent);
    } else if (format === "bradesco") {
      transacoes = parseCSVBradesco(csvContent);
    } else {
      throw new Error(`Formato não suportado: ${format}`);
    }

    if (!transacoes || !transacoes.length) {
      throw new Error("Nenhuma transação encontrada no CSV.");
    }

    // Processar em lotes
    const batches = chunk(transacoes, this.batchSize);
    const classificados: any[] = [];

    for (let i = 0; i < batches.length; i++) {
      const out = await this.classifyBatch(systemPrompt, batches[i]);
      classificados.push(...out);
    }

    // Pós-processo
    for (const t of classificados) {
      t.date = t.date || t.RELEASE_DATE || null;
      if (typeof t.amount === "string") t.amount = parseMoneyBR(t.amount);
      t.bank_id = bankId;
    }

    return classificados;
  }
}
