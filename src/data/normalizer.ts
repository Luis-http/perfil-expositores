import { CONFIG, STATUS_MAP } from "../config";
import type { Implantado, Pipeline } from "../types";

// ── Datas ────────────────────────────────────────────────────

function parseDate(valor: string): Date | null {
  if (!valor || valor.trim() === "") return null;
  const v = valor.trim();

  // aaaa-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const d = new Date(v + "T00:00:00");
    return isNaN(d.getTime()) ? null : d;
  }

  // dd/mm/aaaa ou dd/mm/aa
  const parts = v.split("/");
  if (parts.length === 3) {
    let [dia, mes, ano] = parts.map(Number);
    if (ano < 100) ano += ano >= 50 ? 1900 : 2000;
    const d = new Date(ano, mes - 1, dia);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

// ── Tipos de expositor ────────────────────────────────────────

const TIPO_MAP: Array<[RegExp, string]> = [
  [/vitrine/i, "Vitrine"],
  [/semiv|semi[-. ]?v/i, "Semivertical"],
  [/vertic/i, "Vertical"],       // cobre Vertical, Verticais, VERTICAIS
  [/ilha/i, "Ilha self"],
  [/combinado/i, "Combinado"],
  [/mesa|mesin/i, "Mesa refrigerada"], // cobre Mesa, Mesinha, Mesinhas
];

function normalizeTipo(valor: string): string {
  for (const [re, nome] of TIPO_MAP) {
    if (re.test(valor)) return nome;
  }
  return valor.trim();
}

// ── Status do pipeline ────────────────────────────────────────

function normalizeStatus(valor: string): string {
  if (CONFIG.EXIBIR_STATUS_ORIGINAL) return valor.trim();
  const chave = valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  for (const [k, v] of Object.entries(STATUS_MAP)) {
    const kNorm = k
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
    if (kNorm === chave) return v;
  }
  return valor.trim();
}

// ── Resolução de cabeçalhos ────────────────────────────────────

type ColResolver = (headers: string[]) => number;

function col(...candidatos: string[]): ColResolver {
  return (headers: string[]) => {
    for (const c of candidatos) {
      const idx = headers.findIndex(
        (h) => h.toLowerCase().replace(/[^a-z0-9]/g, "") ===
          c.toLowerCase().replace(/[^a-z0-9]/g, "")
      );
      if (idx !== -1) return idx;
    }
    return -1;
  };
}

function get(row: string[], idx: number): string {
  return idx >= 0 && idx < row.length ? (row[idx] || "").trim() : "";
}

// ── Normalização de Implantados ───────────────────────────────

export function normalizarImplantados(
  rows: string[][],
  headers: string[]
): Implantado[] {
  const iCliente = col("cliente")(headers);
  const iTipo = col("tipodeexpositor", "tipoexpositor", "tipo", "expositor")(headers);
  const iQtd = col("quantidade", "qtd", "qtde")(headers);
  const iPedido = col("ndopedido", "nrdopedido", "pedido", "nopedido", "numeropedido", "nr", "numero")(headers);
  const iLib = col("dataliberaopcp", "dataliberacaopcp", "liberacaopcp", "liberacao", "lib", "dtliberacao")(headers);
  const iEntrega = col("datadeentrega", "dataentrega", "entrega", "dtentrega")(headers);

  return rows
    .filter((r) => r.some((c) => c.trim() !== ""))
    .map((row): Implantado => {
      const liberacao = parseDate(get(row, iLib));
      const entrega = parseDate(get(row, iEntrega));
      let diasAteEntrega: number | null = null;
      if (liberacao && entrega) {
        diasAteEntrega = Math.round(
          (entrega.getTime() - liberacao.getTime()) / 86400000
        );
      }
      return {
        cliente: get(row, iCliente),
        tipo: normalizeTipo(get(row, iTipo)),
        quantidade: Math.max(0, parseInt(get(row, iQtd), 10) || 0),
        pedido: get(row, iPedido),
        liberacaoPCP: liberacao,
        dataEntrega: entrega,
        diasAteEntrega,
      };
    })
    .filter((i) => i.cliente !== "");
}

// ── Normalização de Pipeline ──────────────────────────────────

export function normalizarPipeline(
  rows: string[][],
  headers: string[]
): Pipeline[] {
  const iCliente = col("cliente")(headers);
  const iTipo = col("tipodeexpositor", "tipoexpositor", "tipo", "expositor")(headers);
  const iQtd = col("quantidade", "qtd", "qtde")(headers);
  const iEntrega = col("datadeentrega", "dataentrega", "entrega", "dtentrega", "previsao")(headers);
  const iStatus = col("status", "situacao", "etapa")(headers);

  return rows
    .filter((r) => r.some((c) => c.trim() !== ""))
    .map((row): Pipeline => {
      const statusOriginal = get(row, iStatus);
      return {
        cliente: get(row, iCliente),
        tipo: normalizeTipo(get(row, iTipo)),
        quantidade: Math.max(0, parseInt(get(row, iQtd), 10) || 0),
        dataEntrega: parseDate(get(row, iEntrega)),
        status: normalizeStatus(statusOriginal),
        statusOriginal,
      };
    })
    .filter((p) => p.cliente !== "");
}
