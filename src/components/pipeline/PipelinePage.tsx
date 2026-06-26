import { useState } from "react";
import type { Pipeline } from "../../types";
import { STATUS_ORDER, STATUS_COLORS, CONFIG } from "../../config";
import PipelineGroup from "./PipelineGroup";
import "./PipelinePage.css";
import jsPDF from "jspdf";

interface Props {
  pipeline: Pipeline[];
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("pt-BR");
}

async function carregarLogo(): Promise<{ dataUrl: string; w: number; h: number } | null> {
  try {
    const url = window.location.origin + CONFIG.LOGO_PATH;
    const resp = await fetch(url);
    const blob = await resp.blob();
    const dataUrl = await new Promise<string>((res) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.readAsDataURL(blob);
    });
    const { w, h } = await new Promise<{ w: number; h: number }>((res) => {
      const img = new Image();
      img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => res({ w: 1, h: 1 });
      img.src = dataUrl;
    });
    return { dataUrl, w, h };
  } catch {
    return null;
  }
}

async function gerarPDF(pipeline: Pipeline[], grupos: { status: string; itens: Pipeline[] }[]) {
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const PW = 297;
  const PH = 210;
  const ML = 12;
  const MR = 12;
  const W = PW - ML - MR;

  const totalExp = pipeline.reduce((s, p) => s + p.quantidade, 0);
  const totalClientes = pipeline.length;
  const prontos = pipeline.filter(p => p.status === "Implantar").reduce((s, p) => s + p.quantidade, 0);
  const dataEmissao = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  // Intervalo segunda → sexta da semana atual
  const hoje = new Date();
  const diaSemana = hoje.getDay(); // 0=Dom,1=Seg,...,6=Sáb
  const diffSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
  const segunda = new Date(hoje); segunda.setDate(hoje.getDate() + diffSegunda);
  const sexta   = new Date(segunda); sexta.setDate(segunda.getDate() + 4);
  const fmtCurto = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const semana = `Semana de ${fmtCurto(segunda)} até ${fmtCurto(sexta)}`;

  // Totais por tipo para o gráfico
  const totaisTipo: Record<string, number> = {};
  for (const p of pipeline) {
    totaisTipo[p.tipo] = (totaisTipo[p.tipo] ?? 0) + p.quantidade;
  }
  const tiposOrdenados = Object.entries(totaisTipo).sort((a, b) => b[1] - a[1]);
  const maxTipo = Math.max(...tiposOrdenados.map(([, v]) => v), 1);
  const TIPO_CORES = ["#1f3a5f","#2980b9","#27ae60","#e67e22","#8e44ad","#16a085"];

  // ══════════════════════════════════════════════════════════
  // CABEÇALHO
  // ══════════════════════════════════════════════════════════
  pdf.setFillColor(22, 49, 79);
  pdf.rect(0, 0, PW, 28, "F");

  // Linha decorativa inferior do header
  pdf.setFillColor(41, 128, 185);
  pdf.rect(0, 27, PW, 1.2, "F");

  // Logo
  const logo = await carregarLogo();
  let logoEndX = ML;
  if (logo) {
    const maxH = 18;
    const maxW = 50;
    const ratio = logo.w / logo.h;
    const lh = maxH;
    const lw = Math.min(lh * ratio, maxW);
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(ML - 1, 4.5, lw + 4, lh + 1, 2, 2, "F");
    const ext = CONFIG.LOGO_PATH.toLowerCase().endsWith(".svg") ? "SVG" : "PNG";
    pdf.addImage(logo.dataUrl, ext, ML + 1, 5, lw, lh);
    logoEndX = ML + lw + 8;
  }

  // Título
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(255, 255, 255);
  pdf.text(CONFIG.NOME_EMPRESA, logoEndX, 12);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(160, 184, 216);
  pdf.text("Relatório Semanal de Pipeline — Lojas a Entrar", logoEndX, 19);

  // Data e semana (direita)
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  pdf.text(semana, PW - MR, 12, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(160, 184, 216);
  pdf.text(`Emitido em ${dataEmissao}`, PW - MR, 19, { align: "right" });

  // ══════════════════════════════════════════════════════════
  // CARDS DE RESUMO
  // ══════════════════════════════════════════════════════════
  const cardY = 32;
  const cardH = 20;
  const cardGap = 5;
  const cardW = (W - cardGap * 2) / 3;

  const cards = [
    { label: "TOTAL DE EXPOSITORES", valor: totalExp, sub: "no pipeline atual", cor: "#1f3a5f" as const },
    { label: "CLIENTES EM NEGOCIAÇÃO", valor: totalClientes, sub: `em ${grupos.length} etapas`, cor: "#2980b9" as const },
    { label: "PRONTOS PARA IMPLANTAR", valor: prontos, sub: "status: Implantar", cor: "#27ae60" as const },
  ];

  cards.forEach((c, i) => {
    const cx = ML + i * (cardW + cardGap);
    const [r, g, b] = hexToRgb(c.cor);

    // Sombra simulada
    pdf.setFillColor(220, 226, 234);
    pdf.roundedRect(cx + 0.6, cardY + 0.6, cardW, cardH, 3, 3, "F");

    // Card
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(cx, cardY, cardW, cardH, 3, 3, "F");

    // Barra lateral colorida
    pdf.setFillColor(r, g, b);
    pdf.roundedRect(cx, cardY, 3.5, cardH, 1.5, 1.5, "F");
    pdf.rect(cx + 2, cardY, 1.5, cardH, "F");

    // Valor grande
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(24);
    pdf.setTextColor(r, g, b);
    pdf.text(String(c.valor), cx + 8, cardY + 13);

    // Label
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(74, 85, 104);
    pdf.text(c.label, cx + 8, cardY + 4.5);

    // Sub
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(160, 174, 192);
    pdf.text(c.sub, cx + 8, cardY + 18);
  });

  // ══════════════════════════════════════════════════════════
  // GRÁFICO DE TIPOS (barras horizontais)
  // ══════════════════════════════════════════════════════════
  const chartY = cardY + cardH + 5;
  const chartH = 28;
  const chartW = W;

  // Fundo do bloco
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(ML, chartY, chartW, chartH, 2, 2, "F");
  pdf.setDrawColor(230, 235, 242);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(ML, chartY, chartW, chartH, 2, 2, "S");

  // Título
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.setTextColor(74, 85, 104);
  pdf.text("EXPOSITORES POR TIPO — PIPELINE ATUAL", ML + 3, chartY + 5);

  // Barras
  const barAreaX = ML + 38;
  const barAreaW = chartW - 42;
  const barH = 3.2;
  const barGap = (chartH - 9) / tiposOrdenados.length - barH;
  const barGapAdj = Math.max(barGap, 0.8);

  tiposOrdenados.forEach(([tipo, qtd], i) => {
    const by = chartY + 8 + i * (barH + barGapAdj);
    const bw = (qtd / maxTipo) * barAreaW;
    const [r, g, b] = hexToRgb(TIPO_CORES[i % TIPO_CORES.length]);

    // Label do tipo
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);
    pdf.setTextColor(45, 55, 72);
    pdf.text(tipo, barAreaX - 2, by + barH - 0.8, { align: "right" });

    // Barra de fundo
    pdf.setFillColor(240, 244, 248);
    pdf.roundedRect(barAreaX, by, barAreaW, barH, 1, 1, "F");

    // Barra colorida
    pdf.setFillColor(r, g, b);
    pdf.roundedRect(barAreaX, by, bw, barH, 1, 1, "F");

    // Valor à direita
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.5);
    pdf.setTextColor(r, g, b);
    pdf.text(String(qtd), barAreaX + bw + 2, by + barH - 0.8);
  });

  // ══════════════════════════════════════════════════════════
  // TABELAS POR STATUS
  // ══════════════════════════════════════════════════════════
  const tableY = chartY + chartH + 4;
  const ROW_H = 6;
  const HEAD_H = 8;
  const COL_HEAD_H = 5.5;
  const FOOT_H = 6.5;
  const COL_GAP = 5;
  const COL_W = (W - COL_GAP) / 2;

  // distribui grupos em 2 colunas balanceadas por altura
  const alturaGrupo = (g: { itens: Pipeline[] }) =>
    HEAD_H + COL_HEAD_H + g.itens.length * ROW_H + FOOT_H + 4;

  const col1: typeof grupos = [];
  const col2: typeof grupos = [];
  let h1 = 0, h2 = 0;
  for (const g of grupos) {
    const h = alturaGrupo(g);
    if (h1 <= h2) { col1.push(g); h1 += h; }
    else          { col2.push(g); h2 += h; }
  }

  const desenharGrupo = (
    g: { status: string; itens: Pipeline[] },
    x: number, sy: number, cw: number
  ): number => {
    const cor = STATUS_COLORS[g.status] ?? "#95a5a6";
    const [r, gv, b] = hexToRgb(cor);
    const subtotal = g.itens.reduce((s, p) => s + p.quantidade, 0);
    let cy = sy;

    // ── Header do grupo ──
    pdf.setFillColor(r, gv, b);
    pdf.roundedRect(x, cy, cw, HEAD_H, 2, 2, "F");
    // cortar cantos inferiores
    pdf.rect(x, cy + HEAD_H - 2, cw, 2, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    pdf.text(g.status.toUpperCase(), x + 4, cy + 5.5);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text(
      `${subtotal} expositores · ${g.itens.length} clientes`,
      x + cw - 4, cy + 5.5, { align: "right" }
    );
    cy += HEAD_H;

    // ── Cabeçalho da tabela ──
    pdf.setFillColor(r, gv, b);
    pdf.setGState(new (pdf as any).GState({ opacity: 0.1 }));
    pdf.rect(x, cy, cw, COL_HEAD_H, "F");
    pdf.setGState(new (pdf as any).GState({ opacity: 1 }));

    pdf.setFillColor(245, 247, 250);
    pdf.rect(x, cy, cw, COL_HEAD_H, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.5);
    pdf.setTextColor(r, gv, b);
    const C = {
      cliente: x + 3,
      tipo: x + cw * 0.50,
      qtd: x + cw * 0.70,
      entrega: x + cw * 0.82,
    };
    pdf.text("CLIENTE",  C.cliente, cy + 4);
    pdf.text("TIPO",     C.tipo,    cy + 4);
    pdf.text("QTD",      C.qtd,     cy + 4, { align: "center" });
    pdf.text("ENTREGA",  C.entrega, cy + 4);
    cy += COL_HEAD_H;

    // ── Linhas ──
    for (let i = 0; i < g.itens.length; i++) {
      const item = g.itens[i];
      const ry = cy + i * ROW_H;

      if (i % 2 === 0) {
        pdf.setFillColor(251, 252, 255);
        pdf.rect(x, ry, cw, ROW_H, "F");
      }

      // Linha separadora
      pdf.setDrawColor(230, 235, 242);
      pdf.setLineWidth(0.2);
      pdf.line(x, ry + ROW_H, x + cw, ry + ROW_H);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(45, 55, 72);

      const maxCli = cw * 0.46;
      const nomeCliente = pdf.getTextWidth(item.cliente) > maxCli - 4
        ? pdf.splitTextToSize(item.cliente, maxCli - 4)[0] + "…"
        : item.cliente;
      pdf.text(nomeCliente, C.cliente, ry + ROW_H - 1.8);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(r, gv, b);
      pdf.text(item.tipo, C.tipo, ry + ROW_H - 1.8);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(31, 58, 95);
      pdf.text(String(item.quantidade), C.qtd, ry + ROW_H - 1.8, { align: "center" });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(45, 55, 72);
      pdf.text(fmtDate(item.dataEntrega), C.entrega, ry + ROW_H - 1.8);
    }
    cy += g.itens.length * ROW_H;

    // ── Rodapé subtotal ──
    pdf.setFillColor(r, gv, b);
    pdf.rect(x, cy, cw, FOOT_H, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text("SUBTOTAL", x + cw * 0.68, cy + 4.3, { align: "right" });
    pdf.setFontSize(10);
    pdf.text(String(subtotal), C.qtd, cy + 4.5, { align: "center" });
    cy += FOOT_H;

    // Borda do grupo
    pdf.setDrawColor(r, gv, b);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(x, sy, cw, cy - sy, 2, 2, "S");

    return cy;
  };

  let yc1 = tableY;
  for (const g of col1) yc1 = desenharGrupo(g, ML, yc1, COL_W) + 4;

  let yc2 = tableY;
  for (const g of col2) yc2 = desenharGrupo(g, ML + COL_W + COL_GAP, yc2, COL_W) + 4;

  // ══════════════════════════════════════════════════════════
  // RODAPÉ DA PÁGINA
  // ══════════════════════════════════════════════════════════
  pdf.setFillColor(22, 49, 79);
  pdf.rect(0, PH - 9, PW, 9, "F");

  // Linha decorativa topo rodapé
  pdf.setFillColor(41, 128, 185);
  pdf.rect(0, PH - 9, PW, 1, "F");

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(160, 184, 216);
  pdf.text(`${CONFIG.NOME_EMPRESA} · Relatório Semanal de Pipeline`, ML, PH - 3.5);
  pdf.text(
    `Total: ${totalExp} expositores · ${totalClientes} clientes · ${grupos.length} etapas`,
    PW - MR, PH - 3.5, { align: "right" }
  );

  const agora = new Date().toLocaleDateString("pt-BR");
  pdf.save(`pipeline-perfil-${agora.replace(/\//g, "-")}.pdf`);
}

export default function PipelinePage({ pipeline }: Props) {
  const [exportando, setExportando] = useState(false);

  const grupos: { status: string; itens: Pipeline[] }[] = [];
  const vistos = new Set<string>();
  const ordenados = [
    ...STATUS_ORDER,
    ...pipeline.map((p) => p.status).filter((s) => !STATUS_ORDER.includes(s)).filter((s, i, arr) => arr.indexOf(s) === i),
  ];
  for (const status of ordenados) {
    const itens = pipeline.filter((p) => p.status === status);
    if (itens.length > 0 && !vistos.has(status)) {
      grupos.push({ status, itens });
      vistos.add(status);
    }
  }

  const totalGeral = pipeline.reduce((s, p) => s + p.quantidade, 0);

  const handleExportar = async () => {
    setExportando(true);
    try {
      await gerarPDF(pipeline, grupos);
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="pipeline-page">
      <div className="pipeline-toolbar">
        <div className="pipeline-total">
          Total no pipeline: <strong>{totalGeral}</strong> expositores · <strong>{pipeline.length}</strong> clientes
        </div>
        <button className="btn-pdf" onClick={handleExportar} disabled={exportando}>
          {exportando ? "⏳ Gerando…" : "📄 Exportar PDF"}
        </button>
      </div>

      <div className="pipeline-print-area">
        <div className="pipeline-print-header">
          <div className="pipeline-print-brand">
            <img
              src={CONFIG.LOGO_PATH}
              alt="Logo"
              className="pipeline-print-logo"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div>
              <div className="pipeline-print-title">{CONFIG.NOME_EMPRESA}</div>
              <div className="pipeline-print-sub">Relatório de Pipeline — A Entrar</div>
            </div>
          </div>
          <div className="pipeline-print-date">
            Emitido em {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
          </div>
        </div>

        <div className="pipeline-grupos">
          {grupos.length === 0 ? (
            <p className="pipeline-vazio">Nenhum item no pipeline.</p>
          ) : (
            grupos.map((g) => (
              <PipelineGroup key={g.status} status={g.status} itens={g.itens} cor={STATUS_COLORS[g.status] ?? "#95a5a6"} />
            ))
          )}
        </div>

        <div className="pipeline-rodape">
          Total geral: <strong>{totalGeral}</strong> expositores em <strong>{pipeline.length}</strong> clientes
        </div>
      </div>
    </div>
  );
}
