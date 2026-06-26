import Papa from "papaparse";
import { CONFIG } from "../config";
import type { DadosCarregados, Implantado, Pipeline } from "../types";
import { normalizarImplantados, normalizarPipeline } from "./normalizer";
import { SAMPLE_IMPLANTADOS, SAMPLE_PIPELINE } from "./sampleData";

async function fetchCSV(url: string): Promise<{ headers: string[]; rows: string[][] }> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} ao buscar CSV`);
  const texto = await resp.text();

  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(texto, {
      skipEmptyLines: true,
      complete: (result) => {
        const all = result.data as string[][];
        // Encontra a linha de cabeçalho real: primeira linha que contém "cliente"
        const headerIdx = all.findIndex((row) =>
          row.some((cell) => cell.trim().toLowerCase() === "cliente")
        );
        if (headerIdx === -1 || headerIdx >= all.length - 1) {
          reject(new Error("Cabeçalho 'Cliente' não encontrado no CSV"));
          return;
        }
        const headers = all[headerIdx].map((h) => h.trim());
        const rows = all.slice(headerIdx + 1);
        resolve({ headers, rows });
      },
      error: (err: Error) => reject(err),
    });
  });
}

export async function carregarDados(): Promise<DadosCarregados> {
  const modoDemo =
    !CONFIG.CSV_URL_IMPLANTADOS.trim() && !CONFIG.CSV_URL_PIPELINE.trim();

  if (modoDemo) {
    return {
      implantados: SAMPLE_IMPLANTADOS,
      pipeline: SAMPLE_PIPELINE,
      modoDemo: true,
    };
  }

  let implantados: Implantado[] = [];
  let pipeline: Pipeline[] = [];
  const erros: string[] = [];

  if (CONFIG.CSV_URL_IMPLANTADOS.trim()) {
    try {
      const { headers, rows } = await fetchCSV(CONFIG.CSV_URL_IMPLANTADOS);
      implantados = normalizarImplantados(rows, headers);
    } catch (e) {
      erros.push(`Implantados: ${(e as Error).message}`);
    }
  }

  if (CONFIG.CSV_URL_PIPELINE.trim()) {
    try {
      const { headers, rows } = await fetchCSV(CONFIG.CSV_URL_PIPELINE);
      pipeline = normalizarPipeline(rows, headers);
    } catch (e) {
      erros.push(`Pipeline: ${(e as Error).message}`);
    }
  }

  return {
    implantados,
    pipeline,
    modoDemo: false,
    erro: erros.length > 0 ? erros.join(" | ") : undefined,
  };
}
