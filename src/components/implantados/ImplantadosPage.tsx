import { useState, useMemo } from "react";
import type { Implantado } from "../../types/index";
import ImplantadosTable from "./ImplantadosTable";
import "./ImplantadosPage.css";

interface Props {
  implantados: Implantado[];
}

const OPCOES_PAGINA = [25, 50, 100];

type Ordenacao = "entrega_desc" | "entrega_asc" | "cliente_asc" | "dias_asc" | "dias_desc";

export default function ImplantadosPage({ implantados }: Props) {
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [prazoFiltro, setPrazoFiltro] = useState<"" | "ate30" | "mais30">(""); // tempo para entrega
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("entrega_desc");
  const [porPagina, setPorPagina] = useState(50);
  const [pagina, setPagina] = useState(1);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const tipos = useMemo(() => {
    const set = new Set(implantados.map((i) => i.tipo).filter(Boolean));
    return Array.from(set).sort();
  }, [implantados]);

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase();
    const di = dataInicio ? new Date(dataInicio + "T00:00:00") : null;
    const df = dataFim ? new Date(dataFim + "T23:59:59") : null;

    let lista = implantados.filter((i) => {
      if (q && !i.cliente.toLowerCase().includes(q) && !i.pedido.toLowerCase().includes(q))
        return false;
      if (tipoFiltro && i.tipo !== tipoFiltro) return false;
      if (prazoFiltro === "ate30" && (i.diasAteEntrega === null || i.diasAteEntrega > 30)) return false;
      if (prazoFiltro === "mais30" && (i.diasAteEntrega === null || i.diasAteEntrega <= 30)) return false;
      if ((di || df) && !i.dataEntrega) return false;
      if (di && i.dataEntrega && i.dataEntrega < di) return false;
      if (df && i.dataEntrega && i.dataEntrega > df) return false;
      return true;
    });

    lista = [...lista].sort((a, b) => {
      switch (ordenacao) {
        case "entrega_asc":
          if (!a.dataEntrega && !b.dataEntrega) return 0;
          if (!a.dataEntrega) return 1;
          if (!b.dataEntrega) return -1;
          return a.dataEntrega.getTime() - b.dataEntrega.getTime();
        case "entrega_desc":
          if (!a.dataEntrega && !b.dataEntrega) return 0;
          if (!a.dataEntrega) return 1;
          if (!b.dataEntrega) return -1;
          return b.dataEntrega.getTime() - a.dataEntrega.getTime();
        case "cliente_asc":
          return a.cliente.localeCompare(b.cliente, "pt-BR");
        case "dias_asc":
          return (a.diasAteEntrega ?? 9999) - (b.diasAteEntrega ?? 9999);
        case "dias_desc":
          return (b.diasAteEntrega ?? -1) - (a.diasAteEntrega ?? -1);
        default:
          return 0;
      }
    });

    return lista;
  }, [implantados, busca, tipoFiltro, prazoFiltro, dataInicio, dataFim, ordenacao]);

  const totalPaginas = Math.ceil(filtrados.length / porPagina);
  const paginaAtual = Math.min(pagina, totalPaginas || 1);
  const inicio = (paginaAtual - 1) * porPagina;
  const paginados = filtrados.slice(inicio, inicio + porPagina);
  const totalExpositores = filtrados.reduce((s, i) => s + i.quantidade, 0);

  const resetar = () => {
    setBusca(""); setTipoFiltro(""); setPrazoFiltro("");
    setDataInicio(""); setDataFim(""); setOrdenacao("entrega_desc");
    setPagina(1);
  };

  const filtrosAtivos = !!(busca || tipoFiltro || prazoFiltro || dataInicio || dataFim || ordenacao !== "entrega_desc");

  const mudar = (fn: () => void) => { fn(); setPagina(1); };

  return (
    <div className="implantados-page">

      {/* ── Barra superior ── */}
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
          <button className="btn-limpar" onClick={resetar} title="Limpar filtros">
            ✕ Limpar
          </button>
        )}
        <div className="toolbar-right">
          <div className="implantados-counter">
            <strong>{filtrados.length}</strong> pedidos ·{" "}
            <strong>{totalExpositores}</strong> expositores
          </div>
          <div className="por-pagina">
            <span>Exibir</span>
            {OPCOES_PAGINA.map((n) => (
              <button
                key={n}
                className={`ppagina-btn ${porPagina === n ? "ativo" : ""}`}
                onClick={() => mudar(() => setPorPagina(n))}
              >
                {n}
              </button>
            ))}
            <span>por página</span>
          </div>
        </div>
      </div>

      {/* ── Painel de filtros ── */}
      {filtrosAbertos && (
        <div className="filtros-painel">
          <div className="filtros-grupo">
            <label className="filtro-label">Tipo de expositor</label>
            <select
              className="filtro-select"
              value={tipoFiltro}
              onChange={(e) => mudar(() => setTipoFiltro(e.target.value))}
            >
              <option value="">Todos</option>
              {tipos.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="filtros-grupo">
            <label className="filtro-label">Tempo para entrega</label>
            <div className="filtro-radio-group">
              {[
                { v: "", label: "Todos" },
                { v: "ate30", label: "≤ 30 dias" },
                { v: "mais30", label: "> 30 dias" },
              ].map(({ v, label }) => (
                <button
                  key={v}
                  className={`filtro-radio-btn ${prazoFiltro === v ? "ativo" : ""}`}
                  onClick={() => mudar(() => setPrazoFiltro(v as "" | "ate30" | "mais30"))}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="filtros-grupo">
            <label className="filtro-label">Data de implantação</label>
            <div className="filtro-datas">
              <input
                type="date"
                className="filtro-date"
                value={dataInicio}
                onChange={(e) => mudar(() => setDataInicio(e.target.value))}
                title="De"
              />
              <span className="filtro-ate">até</span>
              <input
                type="date"
                className="filtro-date"
                value={dataFim}
                onChange={(e) => mudar(() => setDataFim(e.target.value))}
                title="Até"
              />
            </div>
          </div>

          <div className="filtros-grupo">
            <label className="filtro-label">Ordenar por</label>
            <select
              className="filtro-select"
              value={ordenacao}
              onChange={(e) => mudar(() => setOrdenacao(e.target.value as Ordenacao))}
            >
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
          <span className="paginacao-info">
            Mostrando {inicio + 1}–{Math.min(inicio + porPagina, filtrados.length)} de {filtrados.length}
          </span>
          <div className="paginacao-btns">
            <button className="pg-btn" onClick={() => setPagina(1)} disabled={paginaAtual === 1} title="Primeira">«</button>
            <button className="pg-btn" onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={paginaAtual === 1} title="Anterior">‹</button>

            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPaginas || (p >= paginaAtual - 2 && p <= paginaAtual + 2))
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((item, i) =>
                item === "..." ? (
                  <span key={`e${i}`} className="pg-ellipsis">…</span>
                ) : (
                  <button
                    key={item}
                    className={`pg-btn ${paginaAtual === item ? "ativo" : ""}`}
                    onClick={() => setPagina(item as number)}
                  >
                    {item}
                  </button>
                )
              )}

            <button className="pg-btn" onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={paginaAtual === totalPaginas} title="Próxima">›</button>
            <button className="pg-btn" onClick={() => setPagina(totalPaginas)} disabled={paginaAtual === totalPaginas} title="Última">»</button>
          </div>
        </div>
      )}
    </div>
  );
}
