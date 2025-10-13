import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import 'dotenv/config';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ======== CONFIG ========
const MODEL = process.env.OPENAI_MODEL || 'gpt-4.1'; // ou 'gpt-5' se disponível
const BATCH_SIZE = 80; // nº de transações por chamada (ajuste se seu CSV for grande)
const INPUT_CSV = process.argv[2]; // caminho do CSV
const OUTPUT_XLSX = process.argv[3] || 'extrato_classificado.xlsx';
const PROMPT_PATH = process.argv[4] || path.join(__dirname, 'prompt-agente.txt');

// ======== API CONFIG ========
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';
const API_KEY = process.env.API_KEY || 'changeme';

// ======== UTILS DE PARSE ========
function parseMoneyBR(str) {
  if (str == null) return null;
  const s = String(str).trim().replace(/\./g, '').replace(',', '.');
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
}
function parseDateBRtoISO(dmy) {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(String(dmy).trim());
  if (!m) return null;
  const [, d, mth, y] = m;
  return `${y}-${mth}-${d}`;
}
function detectHeaderIndex(lines) {
  const headerRE = /^RELEASE_DATE;TRANSACTION_TYPE;REFERENCE_ID;TRANSACTION_NET_AMOUNT;PARTIAL_BALANCE/i;
  return lines.findIndex(l => headerRE.test(l));
}
function parseCSVLikeNubankTabs(raw) {
  // normaliza quebras
  const content = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = content.split('\n').filter(l => l !== null);
  const headerIdx = detectHeaderIndex(lines);
  if (headerIdx < 0) {
    throw new Error('Cabeçalho de transações não encontrado (linha com RELEASE_DATE ...).');
  }
  const dataLines = lines.slice(headerIdx + 1).filter(l => l.trim() !== '');
  const items = [];
  for (const line of dataLines) {
    const cols = line.split(';'); // PONTO E VÍRGULA
    if (cols.length < 5) continue;
    const [RELEASE_DATE, TRANSACTION_TYPE, REFERENCE_ID, TRANSACTION_NET_AMOUNT, PARTIAL_BALANCE] = cols;
    const valor = parseMoneyBR(TRANSACTION_NET_AMOUNT);
    items.push({
      RELEASE_DATE: parseDateBRtoISO(RELEASE_DATE),
      TRANSACTION_TYPE: TRANSACTION_TYPE?.trim(),
      REFERENCE_ID: (REFERENCE_ID ?? '').trim(),
      TRANSACTION_NET_AMOUNT: valor,
      PARTIAL_BALANCE: parseMoneyBR(PARTIAL_BALANCE),
      // campos auxiliares que o agente usa
      descricao_original: TRANSACTION_TYPE?.trim(),
      valor,
      tipo: (valor ?? 0) >= 0 ? 'credito' : 'debito',
    });
  }
  return items;
}
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ======== OPENAI: STRUCTURED OUTPUTS ========
// Docs Structured Outputs (Responses API) e Node SDK: ver referências. :contentReference[oaicite:2]{index=2}
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const responseFormat = {
  type: 'json_schema',
  json_schema: {
    name: 'classificacao_extrato',
    strict: true, // força aderência ao schema
    schema: {
      type: 'object',
      properties: {
        transacoes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              data: { type: 'string', description: 'YYYY-MM-DD' },
              descricao_original: { type: 'string' },
              estabelecimento: { type: 'string' },
              cnpj: { type: 'string' },
              tipo: { type: 'string', enum: ['credito', 'debito'] },
              valor: { type: 'number' },
              categoria: { type: 'string' },
              subcategoria: { type: 'string' },
              meio_pagamento: { type: 'string' },
              banco_origem: { type: 'string' },
              banco_destino: { type: 'string' },
              observacoes: { type: 'string' },
              confianca_classificacao: { type: 'number' },
              id_transacao: { type: 'string' },
            },
            required: ['data', 'descricao_original', 'estabelecimento', 'cnpj', 'tipo', 'valor', 'categoria', 'subcategoria', 'meio_pagamento', 'banco_origem', 'banco_destino', 'observacoes', 'confianca_classificacao', 'id_transacao'],
            additionalProperties: false,
          },
        },
      },
      required: ['transacoes'],
      additionalProperties: false,
    },
  },
};

async function classifyBatch(systemPrompt, batch) {
  const userMsg = [
    `Classifique o seguinte lote de transações (JSON) conforme as regras do prompt de sistema.`,
    `Retorne no schema solicitado (apenas o JSON).`,
    `Lote com ${batch.length} itens:`,
    JSON.stringify(batch, null, 2),
  ].join('\n');

  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMsg },
    ],
    response_format: responseFormat,
  });

  // Chat completions API: pegue o objeto JSON do output
  const out = res.choices?.[0]?.message?.content ?? null;
  if (!out) throw new Error('Resposta vazia do modelo.');

  let parsed;
  try {
    parsed = JSON.parse(out);
  } catch (e) {
    // fallback: tente extrair JSON bruto
    const m = out.match(/\{[\s\S]*\}$/);
    if (!m) throw new Error('Falha ao parsear JSON de saída do modelo.');
    parsed = JSON.parse(m[0]);
  }
  return parsed.transacoes || [];
}

// ======== RESUMOS LOCAIS ========
function summarize(transacoes) {
  const totalEntradas = transacoes
    .filter(t => t.tipo === 'credito' && !excluirDeEntradas(t))
    .reduce((acc, t) => acc + (t.valor || 0), 0);

  const totalSaidas = transacoes
    .filter(t => t.tipo === 'debito' && !excluirDeSaidas(t))
    .reduce((acc, t) => acc + Math.abs(t.valor || 0), 0);

  const saldoFinalEstimado = totalEntradas - totalSaidas;

  // resumo por categoria/subcategoria
  const mapa = new Map();
  for (const t of transacoes) {
    const key = `${t.categoria}|||${t.subcategoria || ''}`;
    const prev = mapa.get(key) || { categoria: t.categoria, subcategoria: t.subcategoria || '', qtd: 0, total: 0 };
    prev.qtd += 1;
    // saída como número positivo
    const delta = t.tipo === 'debito' ? Math.abs(t.valor || 0) : (t.valor || 0);
    // convencionamos total = saídas negativas, entradas positivas no CSV original — aqui guardamos “sinal humano”:
    prev.total += (t.tipo === 'debito' ? -Math.abs(t.valor || 0) : Math.abs(t.valor || 0));
    mapa.set(key, prev);
  }
  const resumoPorCategoria = Array.from(mapa.values()).map(r => ({
    categoria: r.categoria,
    subcategoria: r.subcategoria || null,
    qtd_transacoes: r.qtd,
    total: Number(r.total.toFixed(2)),
    ticket_medio: Number((r.total / r.qtd).toFixed(2)),
  }));

  return {
    visaoGeral: {
      total_entradas: Number(totalEntradas.toFixed(2)),
      total_saidas: Number(totalSaidas.toFixed(2)),
      saldo_final_estimado: Number(saldoFinalEstimado.toFixed(2)),
    },
    resumoPorCategoria,
  };
}

// regras de exclusão (coerentes ao prompt)
function excluirDeSaidas(t) {
  // transferências internas / pagamento de fatura, etc.
  const cat = (t.categoria || '').toLowerCase();
  return cat.includes('transferência interna') || cat.includes('cartão – pagamento de fatura');
}
function excluirDeEntradas(t) {
  // idem acima (se algum caso especial aparecer)
  return false;
}

// ======== EXCEL ========
function writeExcel(transacoes, resumo, outputPath) {
  // Transações
  const txRows = transacoes.map(t => ({
    data: t.data,
    descricao_original: t.descricao_original || '',
    estabelecimento: t.estabelecimento || '',
    cnpj: t.cnpj || '',
    tipo: t.tipo,
    valor: t.valor,
    categoria: t.categoria,
    subcategoria: t.subcategoria || '',
    meio_pagamento: t.meio_pagamento || '',
    banco_origem: t.banco_origem || '',
    banco_destino: t.banco_destino || '',
    observacoes: t.observacoes || '',
    confianca_classificacao: t.confianca_classificacao ?? null,
    id_transacao: t.id_transacao || '',
  }));
  const wsTx = XLSX.utils.json_to_sheet(txRows);

  // Resumo por categoria
  const wsResumo = XLSX.utils.json_to_sheet(resumo.resumoPorCategoria);

  // Visão geral
  const visao = [resumo.visaoGeral];
  const wsVisao = XLSX.utils.json_to_sheet(visao);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsTx, 'Transações');
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo por categoria');
  XLSX.utils.book_append_sheet(wb, wsVisao, 'Visão geral');

  XLSX.writeFile(wb, outputPath);
}

// ======== MAIN ========
async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Faltou OPENAI_API_KEY no .env');
    process.exit(1);
  }
  if (!INPUT_CSV) {
    console.error('Uso: node classificar_extrato.js <caminho_csv> [saida.xlsx] [prompt-agente.txt]');
    process.exit(1);
  }
  const raw = fs.readFileSync(INPUT_CSV, 'utf8');
  const promptAgente = fs.readFileSync(PROMPT_PATH, 'utf8');

  const transacoes = parseCSVLikeNubankTabs(raw);
  if (!transacoes.length) {
    console.error('Nenhuma transação encontrada.');
    process.exit(1);
  }

  console.log(`Transações lidas: ${transacoes.length}. Enviando em lotes de ${BATCH_SIZE}…`);
  const batches = chunk(transacoes, BATCH_SIZE);
  const classificados = [];

  for (let i = 0; i < batches.length; i++) {
    console.log(`Lote ${i + 1}/${batches.length}…`);
    const out = await classifyBatch(promptAgente, batches[i]);
    classificados.push(...out);
  }

  // pós-processo simples: se o modelo não preencher alguns campos opcionais, garanta defaults
  for (const t of classificados) {
    t.data = t.data || t.RELEASE_DATE || null;
    if (typeof t.valor === 'string') t.valor = parseMoneyBR(t.valor);
  }

  const resumo = summarize(classificados);

  writeExcel(classificados, resumo, OUTPUT_XLSX);
  console.log(`✅ Arquivo gerado: ${OUTPUT_XLSX}`);

  // ======== POST TO API ========
  try {
    console.log('📤 Enviando dados para API...');
    
    // Detectar período do CSV
    const dates = classificados.map(t => t.data).filter(Boolean);
    const periodStart = dates.length > 0 ? dates.sort()[0] : '2025-01-01';
    const periodEnd = dates.length > 0 ? dates.sort().reverse()[0] : '2025-01-31';
    
    const payload = {
      userId: 1, // Fixo para MVP
      periodStart,
      periodEnd,
      sourceFile: INPUT_CSV,
      transacoes: classificados
    };

    const response = await fetch(`${API_BASE_URL}/statements/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Dados enviados para API: ${result.inserted} inseridas, ${result.duplicates} duplicadas`);
    } else {
      const error = await response.text();
      console.warn(`⚠️  Falha ao enviar para API: ${response.status} - ${error}`);
    }
  } catch (error) {
    console.warn(`⚠️  Erro ao enviar para API: ${error.message}`);
    console.log('   (Excel foi gerado normalmente)');
  }
}

main().catch(err => {
  console.error('ERRO:', err);
  process.exit(1);
});
