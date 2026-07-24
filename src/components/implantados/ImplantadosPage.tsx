import { useState, useMemo } from "react";
import type { Implantado } from "../../types/index";
import ImplantadosTable from "./ImplantadosTable";
import "./ImplantadosPage.css";
import jsPDF from "jspdf";
import { CONFIG } from "../../config";

interface Props {
  implantados: Implantado[];
}

const OPCOES_PAGINA = [25, 50, 100];
type Ordenacao = "entrega_desc" | "entrega_asc" | "cliente_asc" | "dias_asc" | "dias_desc";

// ── PDF ────────────────────────────────────────────────────────

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
    const imgBitmap = await createImageBitmap(blob);
    const maxDim = 180;
    const scale = Math.min(maxDim / imgBitmap.width, maxDim / imgBitmap.height, 1);
    const cw = Math.round(imgBitmap.width * scale);
    const ch = Math.round(imgBitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = cw; canvas.height = ch;
    canvas.getContext("2d")!.drawImage(imgBitmap, 0, 0, cw, ch);
    return { dataUrl: canvas.toDataURL("image/png"), w: cw, h: ch };
  } catch { return null; }
}

async function exportarPDF(lista: Implantado[], dataInicio: string, dataFim: string) {
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const PW = 297, PH = 210, ML = 12, MR = 12, W = PW - ML - MR;

  const hoje = new Date();
  const dd = String(hoje.getDate()).padStart(2, "0");
  const mm = String(hoje.getMonth() + 1).padStart(2, "0");
  const aaaa = hoje.getFullYear();
  const dataEmissao = hoje.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const totalExp = lista.reduce((s, i) => s + i.quantidade, 0);
  const totalPedidos = lista.length;
  const mediaDias = lista.filter(i => i.diasAteEntrega !== null).length > 0
    ? Math.round(lista.filter(i => i.diasAteEntrega !== null).reduce((s, i) => s + i.diasAteEntrega!, 0) / lista.filter(i => i.diasAteEntrega !== null).length)
    : null;

  const periodoLabel = dataInicio || dataFim
    ? `Liberação PCP: ${dataInicio ? new Date(dataInicio + "T00:00:00").toLocaleDateString("pt-BR") : "início"} até ${dataFim ? new Date(dataFim + "T00:00:00").toLocaleDateString("pt-BR") : "hoje"}`
    : "Todos os registros";

  // ── CABEÇALHO ──
  pdf.setFillColor(22, 49, 79);
  pdf.rect(0, 0, PW, 28, "F");
  pdf.setFillColor(41, 128, 185);
  pdf.rect(0, 27, PW, 1.2, "F");

  const logo = await carregarLogo();
  let logoEndX = ML;
  if (logo) {
    const maxH = 18, maxW = 50;
    const ratio = logo.w / logo.h;
    const lh = maxH, lw = Math.min(lh * ratio, maxW);
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(ML - 1, 4.5, lw + 4, lh + 1, 2, 2, "F");
    pdf.addImage(logo.dataUrl, "PNG", ML + 1, 5, lw, lh);
    logoEndX = ML + lw + 8;
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(255, 255, 255);
  pdf.text(CONFIG.NOME_EMPRESA, logoEndX, 12);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(160, 184, 216);
  pdf.text("Relatório de Expositores Implantados", logoEndX, 19);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  pdf.text(periodoLabel, PW - MR, 12, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(160, 184, 216);
  pdf.text(`Emitido em ${dataEmissao}`, PW - MR, 19, { align: "right" });

  // ── CARDS ──
  const cardY = 32, cardH = 20, cardGap = 5;
  const cardW = (W - cardGap * 2) / 3;
  const cards = [
    { label: "TOTAL DE EXPOSITORES", valor: String(totalExp), sub: "no período selecionado", cor: "#1f3a5f" },
    { label: "PEDIDOS IMPLANTADOS", valor: String(totalPedidos), sub: "linhas exportadas", cor: "#27ae60" },
    { label: "MÉDIA TEMPO ENTREGA", valor: mediaDias !== null ? `${mediaDias} dias` : "—", sub: "liberação → entrega", cor: "#2980b9" },
  ];

  cards.forEach((c, i) => {
    const cx = ML + i * (cardW + cardGap);
    const [r, g, b] = hexToRgb(c.cor);
    pdf.setFillColor(220, 226, 234);
    pdf.roundedRect(cx + 0.6, cardY + 0.6, cardW, cardH, 3, 3, "F");
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(cx, cardY, cardW, cardH, 3, 3, "F");
    pdf.setFillColor(r, g, b);
    pdf.roundedRect(cx, cardY, 3.5, cardH, 1.5, 1.5, "F");
    pdf.rect(cx + 2, cardY, 1.5, cardH, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(74, 85, 104);
    pdf.text(c.label, cx + 8, cardY + 4.5);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(c.valor.length > 5 ? 16 : 22);
    pdf.setTextColor(r, g, b);
    pdf.text(c.valor, cx + 8, cardY + 14);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(160, 174, 192);
    pdf.text(c.sub, cx + 8, cardY + 18);
  });

  // ── TABELAS (demais | ilha self) ──
  const ROW_H = 6.2;
  const HEAD_H = 8;
  const COL_HEAD_H = 6;
  const FOOTER_H = 9;
  const pageBottom = PH - FOOTER_H - 4;

  const ilhas  = lista.filter(i => /ilha/i.test(i.tipo));
  const demais = lista.filter(i => !/ilha/i.test(i.tipo));
  const totalIlhas  = ilhas.reduce((s, i) => s + i.quantidade, 0);
  const totalDemais = demais.reduce((s, i) => s + i.quantidade, 0);

  const C = {
    pedido:  ML + 3,
    cliente: ML + W * 0.12,
    tipo:    ML + W * 0.46,
    qtd:     ML + W * 0.60,
    libpcp:  ML + W * 0.67,
    entrega: ML + W * 0.80,
    dias:    ML + W * 0.92,
  };

  let pagina = 1;

  const desenharRodape = (pg: number) => {
    pdf.setFillColor(22, 49, 79);
    pdf.rect(0, PH - FOOTER_H, PW, FOOTER_H, "F");
    pdf.setFillColor(41, 128, 185);
    pdf.rect(0, PH - FOOTER_H, PW, 1, "F");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(160, 184, 216);
    pdf.text(`${CONFIG.NOME_EMPRESA} · Relatório de Expositores Implantados`, ML, PH - 3.2);
    pdf.text(`Página ${pg} · Total: ${totalExp} expositores · ${totalPedidos} pedidos`, PW - MR, PH - 3.2, { align: "right" });
  };
  desenharRodape(pagina);

  const desenharCabecalhoTabela = (
    cy: number, titulo: string, subtotal: number, qtdLinhas: number, cor: string
  ): number => {
    const [r, g, b] = hexToRgb(cor);
    pdf.setFillColor(r, g, b);
    pdf.roundedRect(ML, cy, W, HEAD_H, 2, 2, "F");
    pdf.rect(ML, cy + HEAD_H - 2, W, 2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    pdf.text(titulo, ML + 4, cy + 5.5);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.text(`${subtotal} expositores · ${qtdLinhas} pedidos`, ML + W - 4, cy + 5.5, { align: "right" });
    cy += HEAD_H;

    pdf.setFillColor(245, 247, 250);
    pdf.rect(ML, cy, W, COL_HEAD_H, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.5);
    pdf.setTextColor(r, g, b);
    pdf.text("PEDIDO",   C.pedido,  cy + 4.2);
    pdf.text("CLIENTE",  C.cliente, cy + 4.2);
    pdf.text("TIPO",     C.tipo,    cy + 4.2);
    pdf.text("QTD",      C.qtd,     cy + 4.2, { align: "center" });
    pdf.text("LIB. PCP", C.libpcp,  cy + 4.2);
    pdf.text("ENTREGA",  C.entrega, cy + 4.2);
    pdf.text("DIAS",     C.dias,    cy + 4.2, { align: "center" });
    return cy + COL_HEAD_H;
  };

  const desenharCabecalhoColuna = (cy: number, cor: string): number => {
    const [r, g, b] = hexToRgb(cor);
    pdf.setFillColor(245, 247, 250);
    pdf.rect(ML, cy, W, COL_HEAD_H, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.5);
    pdf.setTextColor(r, g, b);
    pdf.text("PEDIDO",   C.pedido,  cy + 4.2);
    pdf.text("CLIENTE",  C.cliente, cy + 4.2);
    pdf.text("TIPO",     C.tipo,    cy + 4.2);
    pdf.text("QTD",      C.qtd,     cy + 4.2, { align: "center" });
    pdf.text("LIB. PCP", C.libpcp,  cy + 4.2);
    pdf.text("ENTREGA",  C.entrega, cy + 4.2);
    pdf.text("DIAS",     C.dias,    cy + 4.2, { align: "center" });
    return cy + COL_HEAD_H;
  };

  const desenharLinha = (item: Implantado, ry: number, idx: number, cor: string) => {
    const [r, g, b] = hexToRgb(cor);
    if (idx % 2 === 0) { pdf.setFillColor(251, 252, 255); pdf.rect(ML, ry, W, ROW_H, "F"); }
    pdf.setDrawColor(230, 235, 242); pdf.setLineWidth(0.2);
    pdf.line(ML, ry + ROW_H, ML + W, ry + ROW_H);

    pdf.setFont("helvetica", "bold"); pdf.setFontSize(7); pdf.setTextColor(r, g, b);
    pdf.text(item.pedido || "—", C.pedido, ry + ROW_H - 1.8);

    pdf.setFont("helvetica", "normal"); pdf.setFontSize(7); pdf.setTextColor(45, 55, 72);
    const maxCli = W * 0.32;
    const nomeCli = pdf.getTextWidth(item.cliente) > maxCli ? pdf.splitTextToSize(item.cliente, maxCli)[0] + "…" : item.cliente;
    pdf.text(nomeCli, C.cliente, ry + ROW_H - 1.8);

    pdf.setFont("helvetica", "bold"); pdf.setFontSize(6.5); pdf.setTextColor(r, g, b);
    pdf.text(item.tipo, C.tipo, ry + ROW_H - 1.8);

    pdf.setFont("helvetica", "bold"); pdf.setFontSize(8); pdf.setTextColor(31, 58, 95);
    pdf.text(String(item.quantidade), C.qtd, ry + ROW_H - 1.8, { align: "center" });

    pdf.setFont("helvetica", "normal"); pdf.setFontSize(7); pdf.setTextColor(45, 55, 72);
    pdf.text(fmtDate(item.liberacaoPCP), C.libpcp, ry + ROW_H - 1.8);
    pdf.text(fmtDate(item.dataEntrega),  C.entrega, ry + ROW_H - 1.8);

    if (item.diasAteEntrega !== null) {
      const dc = item.diasAteEntrega > 30 ? "#e67e22" : "#27ae60";
      const [dr, dg, db] = hexToRgb(dc);
      pdf.setFillColor(dr, dg, db);
      pdf.roundedRect(C.dias - 4, ry + 0.8, 10, ROW_H - 1.8, 1.5, 1.5, "F");
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(7); pdf.setTextColor(255, 255, 255);
      pdf.text(String(item.diasAteEntrega), C.dias, ry + ROW_H - 1.8, { align: "center" });
    } else {
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(7); pdf.setTextColor(160, 174, 192);
      pdf.text("—", C.dias, ry + ROW_H - 1.8, { align: "center" });
    }
  };

  const desenharGrupo = (
    grupo: Implantado[], titulo: string, subtotal: number, cor: string, cyInicio: number
  ): number => {
    let cy = cyInicio;
    const tabStart = cy;
    cy = desenharCabecalhoTabela(cy, titulo, subtotal, grupo.length, cor);

    for (let i = 0; i < grupo.length; i++) {
      if (cy + ROW_H > pageBottom) {
        // fecha borda da tabela até aqui
        const [r, g, b] = hexToRgb(cor);
        pdf.setDrawColor(r, g, b); pdf.setLineWidth(0.5);
        pdf.roundedRect(ML, tabStart, W, cy - tabStart, 2, 2, "S");

        pagina++; pdf.addPage();
        desenharRodape(pagina);
        cy = 8;
        cy = desenharCabecalhoColuna(cy, cor);
      }
      desenharLinha(grupo[i], cy, i, cor);
      cy += ROW_H;
    }

    // rodapé subtotal
    const [r, g, b] = hexToRgb(cor);
    pdf.setFillColor(r, g, b);
    pdf.rect(ML, cy, W, 6.5, "F");
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(8); pdf.setTextColor(255, 255, 255);
    pdf.text("SUBTOTAL", ML + W * 0.55, cy + 4.3, { align: "right" });
    pdf.text(String(subtotal), C.qtd, cy + 4.5, { align: "center" });
    cy += 6.5;

    pdf.setDrawColor(r, g, b); pdf.setLineWidth(0.5);
    pdf.roundedRect(ML, tabStart, W, cy - tabStart, 2, 2, "S");

    return cy;
  };

  let cy = cardY + cardH + 6;
  if (demais.length > 0) cy = desenharGrupo(demais, "DEMAIS EXPOSITORES", totalDemais, "#1f3a5f", cy) + 5;
  if (ilhas.length > 0)  cy = desenharGrupo(ilhas,  "ILHA SELF",          totalIlhas,  "#16a085", cy);

  pdf.save(`Expositores Implantados ${dd}-${mm}-${aaaa}.pdf`);
}

// ── COMPONENTE ─────────────────────────────────────────────────

export default function ImplantadosPage({ implantados }: Props) {
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [prazoFiltro, setPrazoFiltro] = useState<"" | "ate30" | "mais30">("") ;
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("entrega_desc");
  const [porPagina, setPorPagina] = useState(50);
  const [pagina, setPagina] = useState(1);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [exportando, setExportando] = useState(false);

  const tipos = useMemo(() => {
    const set = new Set(implantados.map((i) => i.tipo).filter(Boolean));
    return Array.from(set).sort();
  }, [implantados]);

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase();
    const di = dataInicio ? new Date(dataInicio + "T00:00:00") : null;
    const df = dataFim ? new Date(dataFim + "T23:59:59") : null;

    let lista = implantados.filter((i) => {
      if (q && !i.cliente.toLowerCase().includes(q) && !i.pedido.toLowerCase().includes(q)) return false;
      if (tipoFiltro && i.tipo !== tipoFiltro) return false;
      if (prazoFiltro === "ate30" && (i.diasAteEntrega === null || i.diasAteEntrega > 30)) return false;
      if (prazoFiltro === "mais30" && (i.diasAteEntrega === null || i.diasAteEntrega <= 30)) return false;
      if ((di || df) && !i.liberacaoPCP) return false;
      if (di && i.liberacaoPCP && i.liberacaoPCP < di) return false;
      if (df && i.liberacaoPCP && i.liberacaoPCP > df) return false;
      return true;
    });

    return [...lista].sort((a, b) => {
      switch (ordenacao) {
        case "entrega_asc":
          if (!a.dataEntrega && !b.dataEntrega) return 0;
          if (!a.dataEntrega) return 1; if (!b.dataEntrega) return -1;
          return a.dataEntrega.getTime() - b.dataEntrega.getTime();
        case "entrega_desc":
          if (!a.dataEntrega && !b.dataEntrega) return 0;
          if (!a.dataEntrega) return 1; if (!b.dataEntrega) return -1;
          return b.dataEntrega.getTime() - a.dataEntrega.getTime();
        case "cliente_asc": return a.cliente.localeCompare(b.cliente, "pt-BR");
        case "dias_asc": return (a.diasAteEntrega ?? 9999) - (b.diasAteEntrega ?? 9999);
        case "dias_desc": return (b.diasAteEntrega ?? -1) - (a.diasAteEntrega ?? -1);
        default: return 0;
      }
    });
  }, [implantados, busca, tipoFiltro, prazoFiltro, dataInicio, dataFim, ordenacao]);

  const totalPaginas = Math.ceil(filtrados.length / porPagina);
  const paginaAtual = Math.min(pagina, totalPaginas || 1);
  const inicio = (paginaAtual - 1) * porPagina;
  const paginados = filtrados.slice(inicio, inicio + porPagina);
  const totalExpositores = filtrados.reduce((s, i) => s + i.quantidade, 0);

  const resetar = () => {
    setBusca(""); setTipoFiltro(""); setPrazoFiltro("");
    setDataInicio(""); setDataFim(""); setOrdenacao("entrega_desc"); setPagina(1);
  };
  const filtrosAtivos = !!(busca || tipoFiltro || prazoFiltro || dataInicio || dataFim || ordenacao !== "entrega_desc");
  const mudar = (fn: () => void) => { fn(); setPagina(1); };

  const handleExportar = async () => {
    setExportando(true);
    try { await exportarPDF(filtrados, dataInicio, dataFim); }
    finally { setExportando(false); }
  };

  return (
    <div className="implantados-page">
      <div className="implantados-toolbar">
        <input
          type="search"
          className="busca-input"
          placeholder="Buscar por cliente ou pedido…"
          value={busca}
          onChange={(e) => mudar(() => setBusca(e.target.value))}
        />
        <button
          className={`btn-filtros ${filtrosAbertos ? "aberto" : ""} ${filtrosAtivos ? "ativo" : ""}`}
          onClick={() => setFiltrosAbertos((v) => !v)}
        >
          ⚙ Filtros{filtrosAtivos ? " •" : ""}
        </button>
        {filtrosAtivos && (
          <button className="btn-limpar" onClick={resetar}>✕ Limpar</button>
        )}
        <button className="btn-pdf" onClick={handleExportar} disabled={exportando}>
          {exportando ? "⏳ Gerando…" : "📄 Exportar PDF"}
        </button>
        <div className="toolbar-right">
          <div className="implantados-counter">
            <strong>{filtrados.length}</strong> pedidos · <strong>{totalExpositores}</strong> expositores
          </div>
          <div className="por-pagina">
            <span>Exibir</span>
            {OPCOES_PAGINA.map((n) => (
              <button key={n} className={`ppagina-btn ${porPagina === n ? "ativo" : ""}`} onClick={() => mudar(() => setPorPagina(n))}>{n}</button>
            ))}
            <span>por página</span>
          </div>
        </div>
      </div>

      {filtrosAbertos && (
        <div className="filtros-painel">
          <div className="filtros-grupo">
            <label className="filtro-label">Tipo de expositor</label>
            <select className="filtro-select" value={tipoFiltro} onChange={(e) => mudar(() => setTipoFiltro(e.target.value))}>
              <option value="">Todos</option>
              {tipos.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="filtros-grupo">
            <label className="filtro-label">Tempo para entrega</label>
            <div className="filtro-radio-group">
              {[{ v: "", label: "Todos" }, { v: "ate30", label: "≤ 30 dias" }, { v: "mais30", label: "> 30 dias" }].map(({ v, label }) => (
                <button key={v} className={`filtro-radio-btn ${prazoFiltro === v ? "ativo" : ""}`} onClick={() => mudar(() => setPrazoFiltro(v as "" | "ate30" | "mais30"))}>{label}</button>
              ))}
            </div>
          </div>
          <div className="filtros-grupo">
            <label className="filtro-label">Data liberação PCP</label>
            <div className="filtro-datas">
              <input type="date" className="filtro-date" value={dataInicio} onChange={(e) => mudar(() => setDataInicio(e.target.value))} />
              <span className="filtro-ate">até</span>
              <input type="date" className="filtro-date" value={dataFim} onChange={(e) => mudar(() => setDataFim(e.target.value))} />
            </div>
          </div>
          <div className="filtros-grupo">
            <label className="filtro-label">Ordenar por</label>
            <select className="filtro-select" value={ordenacao} onChange={(e) => mudar(() => setOrdenacao(e.target.value as Ordenacao))}>
              <option value="entrega_desc">Data de entrega (mais recente)</option>
              <option value="entrega_asc">Data de entrega (mais antiga)</option>
              <option value="cliente_asc">Cliente (A → Z)</option>
              <option value="dias_asc">Tempo de entrega (menor)</option>
              <option value="dias_desc">Tempo de entrega (maior)</option>
            </select>
          </div>
        </div>
      )}

      <ImplantadosTable implantados={paginados} />

      {totalPaginas > 1 && (
        <div className="paginacao">
          <span className="paginacao-info">Mostrando {inicio + 1}–{Math.min(inicio + porPagina, filtrados.length)} de {filtrados.length}</span>
          <div className="paginacao-btns">
            <button className="pg-btn" onClick={() => setPagina(1)} disabled={paginaAtual === 1}>«</button>
            <button className="pg-btn" onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={paginaAtual === 1}>‹</button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPaginas || (p >= paginaAtual - 2 && p <= paginaAtual + 2))
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                acc.push(p); return acc;
              }, [])
              .map((item, i) => item === "..." ? (
                <span key={`e${i}`} className="pg-ellipsis">…</span>
              ) : (
                <button key={item} className={`pg-btn ${paginaAtual === item ? "ativo" : ""}`} onClick={() => setPagina(item as number)}>{item}</button>
              ))}
            <button className="pg-btn" onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={paginaAtual === totalPaginas}>›</button>
            <button className="pg-btn" onClick={() => setPagina(totalPaginas)} disabled={paginaAtual === totalPaginas}>»</button>
          </div>
        </div>
      )}
    </div>
  );
}
