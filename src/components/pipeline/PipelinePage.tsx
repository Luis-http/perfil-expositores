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

async function gerarPDF(pipeline: Pipeline[], grupos: { status: string; itens: Pipeline[] }[]) {
  // A4 Paisagem: 297 x 210 mm
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const PW = 297;
  const PH = 210;
  const ML = 14; // margem esquerda
  const MR = 14; // margem direita
  const W = PW - ML - MR;
  const dataEmissao = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  // ── Cabeçalho ──────────────────────────────────────────────
  pdf.setFillColor(22, 49, 79);       // azul-marinho #16314f
  pdf.rect(0, 0, PW, 22, "F");

  // Tenta carregar logo mantendo proporção real
  const logoUrl = window.location.origin + CONFIG.LOGO_PATH;
  try {
    const resp = await fetch(logoUrl);
    const blob = await resp.blob();
    const dataUrl = await new Promise<string>((res) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.readAsDataURL(blob);
    });
    // descobre dimensões reais para não distorcer
    const { w: iw, h: ih } = await new Promise<{ w: number; h: number }>((res) => {
      const img = new Image();
      img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => res({ w: 1, h: 1 });
      img.src = dataUrl;
    });
    const maxH = 14; // altura máxima no PDF (mm)
    const maxW = 40; // largura máxima
    const ratio = iw / ih;
    const logoH = maxH;
    const logoW = Math.min(logoH * ratio, maxW);
    const ext = CONFIG.LOGO_PATH.toLowerCase().endsWith(".svg") ? "SVG" : "PNG";
    // fundo branco atrás do logo para garantir visibilidade
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(ML - 1, 3, logoW + 4, logoH + 2, 2, 2, "F");
    pdf.addImage(dataUrl, ext, ML + 1, 4, logoW, logoH);
  } catch {
    // logo não carregou — segue sem ela
  }

  // Título no cabeçalho (offset maior para não sobrepor logo)
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text(CONFIG.NOME_EMPRESA, ML + 48, 10);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(160, 184, 216);
  pdf.text("Relatório de Pipeline — A Entrar", ML + 48, 16);

  // Data de emissão alinhada à direita
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(8);
  pdf.setTextColor(160, 184, 216);
  pdf.text(`Emitido em ${dataEmissao}`, PW - MR, 14, { align: "right" });

  // ── Totalizador resumo ──────────────────────────────────────
  const totalGeral = pipeline.reduce((s, p) => s + p.quantidade, 0);
  let y = 28;

  pdf.setFillColor(240, 244, 248);
  pdf.roundedRect(ML, y, W, 9, 2, 2, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(31, 58, 95);
  pdf.text(
    `Total no pipeline: ${totalGeral} expositores  ·  ${pipeline.length} clientes  ·  ${grupos.length} status`,
    ML + 4, y + 6
  );
  y += 14;

  // ── Tabelas por status (duas colunas se couber) ─────────────
  const COL_GAP = 6;
  const COL_W = (W - COL_GAP) / 2;

  // Altura estimada de cada grupo
  const ROW_H = 6.5;
  const GROUP_HEAD = 8;
  const GROUP_FOOT = 7;

  const alturaGrupo = (g: { itens: Pipeline[] }) =>
    GROUP_HEAD + g.itens.length * ROW_H + GROUP_FOOT;

  // Distribui em 2 colunas
  const col1: typeof grupos = [];
  const col2: typeof grupos = [];
  let h1 = 0, h2 = 0;
  for (const g of grupos) {
    const h = alturaGrupo(g);
    if (h1 <= h2) { col1.push(g); h1 += h + 4; }
    else          { col2.push(g); h2 += h + 4; }
  }

  const desenharGrupo = (
    g: { status: string; itens: Pipeline[] },
    x: number, startY: number, colW: number
  ): number => {
    const cor = STATUS_COLORS[g.status] ?? "#95a5a6";
    const [r, g2, b] = hexToRgb(cor);
    let cy = startY;

    // Header do grupo
    pdf.setFillColor(r, g2, b);
    pdf.roundedRect(x, cy, colW, GROUP_HEAD, 1.5, 1.5, "F");

    const subtotal = g.itens.reduce((s, p) => s + p.quantidade, 0);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text(g.status, x + 3, cy + 5.5);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.text(`${subtotal} expositores · ${g.itens.length} clientes`, x + colW - 3, cy + 5.5, { align: "right" });
    cy += GROUP_HEAD;

    // Cabeçalho da tabela
    pdf.setFillColor(245, 248, 252);
    pdf.rect(x, cy, colW, 5.5, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);

    const C = { cliente: x + 3, tipo: x + colW * 0.52, qtd: x + colW * 0.72, entrega: x + colW * 0.84 };
    pdf.text("CLIENTE",           C.cliente, cy + 4);
    pdf.text("TIPO",              C.tipo,    cy + 4);
    pdf.text("QTD",               C.qtd,     cy + 4, { align: "center" });
    pdf.text("ENTREGA",           C.entrega, cy + 4);
    cy += 5.5;

    // Linhas
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    for (let i = 0; i < g.itens.length; i++) {
      const item = g.itens[i];
      const rowY = cy + i * ROW_H;

      if (i % 2 === 0) {
        pdf.setFillColor(252, 253, 255);
        pdf.rect(x, rowY, colW, ROW_H, "F");
      }

      pdf.setTextColor(30, 41, 59);
      const clienteMax = colW * 0.48;
      const nomeCliente = pdf.getTextWidth(item.cliente) > clienteMax - 4
        ? pdf.splitTextToSize(item.cliente, clienteMax - 4)[0] + "…"
        : item.cliente;
      pdf.text(nomeCliente, C.cliente, rowY + ROW_H - 2);

      pdf.setTextColor(31, 58, 95);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.text(item.tipo, C.tipo, rowY + ROW_H - 2);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(30, 41, 59);
      pdf.text(String(item.quantidade), C.qtd, rowY + ROW_H - 2, { align: "center" });
      pdf.text(fmtDate(item.dataEntrega), C.entrega, rowY + ROW_H - 2);
    }
    cy += g.itens.length * ROW_H;

    // Rodapé subtotal
    pdf.setFillColor(r, g2, b, 0.12);
    pdf.setFillColor(Math.min(r + 40, 255), Math.min(g2 + 40, 255), Math.min(b + 40, 255));
    pdf.rect(x, cy, colW, GROUP_FOOT, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(r, g2, b);
    pdf.text("Subtotal", x + colW * 0.68, cy + 4.8, { align: "right" });
    pdf.text(String(subtotal), C.qtd, cy + 4.8, { align: "center" });
    cy += GROUP_FOOT;

    // Borda do grupo
    pdf.setDrawColor(r, g2, b);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(x, startY, colW, cy - startY, 1.5, 1.5, "S");

    return cy;
  };

  // Desenha coluna 1
  let yc1 = y;
  for (const g of col1) {
    yc1 = desenharGrupo(g, ML, yc1, COL_W) + 4;
  }

  // Desenha coluna 2
  let yc2 = y;
  for (const g of col2) {
    yc2 = desenharGrupo(g, ML + COL_W + COL_GAP, yc2, COL_W) + 4;
  }

  // ── Rodapé da página ───────────────────────────────────────
  pdf.setFillColor(22, 49, 79);
  pdf.rect(0, PH - 8, PW, 8, "F");
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(160, 184, 216);
  pdf.text(`${CONFIG.NOME_EMPRESA} · Controle de Expositores`, ML, PH - 3);
  pdf.text(
    `Total: ${totalGeral} expositores · ${pipeline.length} clientes`,
    PW - MR, PH - 3, { align: "right" }
  );

  const agora = new Date().toLocaleDateString("pt-BR");
  pdf.save(`pipeline-expositores-${agora.replace(/\//g, "-")}.pdf`);
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
