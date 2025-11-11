import * as XLSX from "xlsx";
import type {
  ExcelData,
  Transaction,
  CategorySummary,
  OverviewSummary,
} from "@/types";
import dayjs from "dayjs";

export const readExcelFile = async (file: File): Promise<ExcelData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        // Verificar se as abas necessárias existem
        const requiredSheets = [
          "Transações",
          "Resumo por categoria",
          "Visão geral",
        ];
        const missingSheets = requiredSheets.filter(
          (sheet) => !workbook.SheetNames.includes(sheet),
        );

        if (missingSheets.length > 0) {
          throw new Error(
            `Abas obrigatórias não encontradas: ${missingSheets.join(", ")}`,
          );
        }

        // Ler aba de Transações
        const transacoesSheet = workbook.Sheets["Transações"];
        const transacoesData = XLSX.utils.sheet_to_json(transacoesSheet, {
          header: 1,
        });

        if (transacoesData.length < 2) {
          throw new Error('Aba "Transações" está vazia ou não possui dados');
        }

        const headers = transacoesData[0] as string[];
        const requiredColumns = ["data", "tipo", "valor", "categoria"];
        const missingColumns = requiredColumns.filter(
          (col) => !headers.includes(col),
        );

        if (missingColumns.length > 0) {
          throw new Error(
            `Colunas obrigatórias não encontradas: ${missingColumns.join(", ")}`,
          );
        }

        const transacoes: Transaction[] = transacoesData
          .slice(1)
          .map((row: any[]) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          })
          .filter((row: any) => {
            // Validar dados essenciais
            return (
              row.data &&
              row.tipo &&
              typeof row.valor === "number" &&
              row.categoria
            );
          })
          .map(
            (row: any): Transaction => ({
              data: normalizeDate(row.data),
              descricao_original: row.descricao_original || "",
              estabelecimento: row.estabelecimento || "",
              cnpj: row.cnpj || "",
              tipo: row.tipo as "credito" | "debito",
              valor: Number(row.valor) || 0,
              categoria: row.categoria || "",
              subcategoria: row.subcategoria || "",
              meio_pagamento: row.meio_pagamento || "",
              banco_origem: row.banco_origem || "",
              banco_destino: row.banco_destino || "",
              observacoes: row.observacoes || "",
              confianca_classificacao: Number(row.confianca_classificacao) || 0,
              id_transacao: row.id_transacao || "",
            }),
          );

        // Ler aba de Resumo por categoria
        const resumoSheet = workbook.Sheets["Resumo por categoria"];
        const resumoData = XLSX.utils.sheet_to_json(resumoSheet, { header: 1 });
        const resumoHeaders = resumoData[0] as string[];
        const resumoPorCategoria: CategorySummary[] = resumoData
          .slice(1)
          .map((row: any[]) => {
            const obj: any = {};
            resumoHeaders.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          })
          .map(
            (row: any): CategorySummary => ({
              categoria: row.categoria || "",
              subcategoria: row.subcategoria || null,
              qtd_transacoes: Number(row.qtd_transacoes) || 0,
              total: Number(row.total) || 0,
              ticket_medio: Number(row.ticket_medio) || 0,
            }),
          );

        // Ler aba de Visão geral
        const visaoSheet = workbook.Sheets["Visão geral"];
        const visaoData = XLSX.utils.sheet_to_json(visaoSheet, { header: 1 });
        const visaoHeaders = visaoData[0] as string[];
        const visaoRow = visaoData[1] as any[];
        const visaoGeral: OverviewSummary = {
          total_entradas:
            Number(visaoRow[visaoHeaders.indexOf("total_entradas")]) || 0,
          total_saidas:
            Number(visaoRow[visaoHeaders.indexOf("total_saidas")]) || 0,
          saldo_final_estimado:
            Number(visaoRow[visaoHeaders.indexOf("saldo_final_estimado")]) || 0,
        };

        resolve({
          transacoes,
          resumoPorCategoria,
          visaoGeral,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Erro ao ler o arquivo"));
    };

    reader.readAsArrayBuffer(file);
  });
};

const normalizeDate = (date: any): string => {
  if (!date) return "";

  // Se já é uma string no formato ISO
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  // Tentar converter para ISO
  const parsed = dayjs(date);
  if (parsed.isValid()) {
    return parsed.format("YYYY-MM-DD");
  }

  return "";
};

export const saveToLocalStorage = (data: ExcelData, fileName: string) => {
  const cache = {
    data,
    fileName,
    timestamp: Date.now(),
  };
  localStorage.setItem("bankDashboardCacheV1", JSON.stringify(cache));
};

export const loadFromLocalStorage = (): {
  data: ExcelData;
  fileName: string;
} | null => {
  try {
    const cached = localStorage.getItem("bankDashboardCacheV1");
    if (!cached) return null;

    const parsed = JSON.parse(cached);
    return {
      data: parsed.data,
      fileName: parsed.fileName,
    };
  } catch {
    return null;
  }
};

export const clearLocalStorage = () => {
  localStorage.removeItem("bankDashboardCacheV1");
};
