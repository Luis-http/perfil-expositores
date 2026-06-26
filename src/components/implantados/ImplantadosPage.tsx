import { useState, useMemo } from "react";
import type { Implantado } from "../../types";
import ImplantadosTable from "./ImplantadosTable";
import "./ImplantadosPage.css";

interface Props {
  implantados: Implantado[];
}

const OPCOES_PAGINA = [25, 50, 100];

export default function ImplantadosPage({ implantados }: Props) {
  const [busca, setBusca] = useState("");
  const [porPagina, setPorPagina] = useState(50);
  const [pagina, setPagina] = useState(1);

  // Filtra + ordena do mais recente para o mais antigo
  const filtrados = useMemo(() => {
    const q = busca.toLowerCase();
    const lista = q
      ? implantados.filter(
          (i) =>
            i.cliente.toLowerCase().includes(q) ||
            i.pedido.toLowerCase().includes(q)
        )
      : [...implantados];

    return lista.sort((a, b) => {
      if (!a.dataEntrega && !b.dataEntrega) return 0;
      if (!a.dataEntrega) return 1;
      if (!b.dataEntrega) return -1;
      return b.dataEntrega.getTime() - a.dataEntrega.getTime();
    });
  }, [implantados, busca]);

  const totalPaginas = Math.ceil(filtrados.length / porPagina);
  const paginaAtual = Math.min(pagina, totalPaginas || 1);
  const inicio = (paginaAtual - 1) * porPagina;
  const paginados = filtrados.slice(inicio, inicio + porPagina);

  const totalExpositores = filtrados.reduce((s, i) => s + i.quantidade, 0);

  const mudarPorPagina = (n: number) => {
    setPorPagina(n);
    setPagina(1);
  };

  const mudarBusca = (v: string) => {
    setBusca(v);
    setPagina(1);
  };

  return (
    <div className="implantados-page">
      <div className="implantados-toolbar">
        <input
          type="search"
          className="busca-input"
          placeholder="Buscar por cliente ou número do pedido…"
          value={busca}
          onChange={(e) => mudarBusca(e.target.value)}
        />
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
                onClick={() => mudarPorPagina(n)}
              >
                {n}
              </button>
            ))}
            <span>por página</span>
          </div>
        </div>
      </div>

      <ImplantadosTable implantados={paginados} />

      {totalPaginas > 1 && (
        <div className="paginacao">
          <span className="paginacao-info">
            Mostrando {inicio + 1}–{Math.min(inicio + porPagina, filtrados.length)} de {filtrados.length}
          </span>
          <div className="paginacao-btns">
            <button
              className="pg-btn"
              onClick={() => setPagina(1)}
              disabled={paginaAtual === 1}
              title="Primeira"
            >«</button>
            <button
              className="pg-btn"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
              title="Anterior"
            >‹</button>

            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
              .filter((p) =>
                p === 1 || p === totalPaginas ||
                (p >= paginaAtual - 2 && p <= paginaAtual + 2)
              )
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

            <button
              className="pg-btn"
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual === totalPaginas}
              title="Próxima"
            >›</button>
            <button
              className="pg-btn"
              onClick={() => setPagina(totalPaginas)}
              disabled={paginaAtual === totalPaginas}
              title="Última"
            >»</button>
          </div>
        </div>
      )}
    </div>
  );
}
