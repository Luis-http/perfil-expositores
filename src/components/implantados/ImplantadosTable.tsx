import type { Implantado } from "../../types";
import "./ImplantadosTable.css";

interface Props {
  implantados: Implantado[];
}

function fmt(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("pt-BR");
}

export default function ImplantadosTable({ implantados }: Props) {
  if (implantados.length === 0) {
    return <p className="tabela-vazia">Nenhum registro encontrado.</p>;
  }

  return (
    <div className="tabela-wrapper">
      <table className="tabela-implantados">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Tipo</th>
            <th className="col-num">Qtd</th>
            <th>Pedido</th>
            <th>Liberação PCP</th>
            <th>Entrega</th>
            <th>Tempo para entrega (dias)</th>
          </tr>
        </thead>
        <tbody>
          {implantados.map((i, idx) => (
            <tr key={idx}>
              <td>{i.cliente}</td>
              <td>
                <span className="badge-tipo">{i.tipo}</span>
              </td>
              <td className="col-num">{i.quantidade}</td>
              <td className="col-pedido">{i.pedido}</td>
              <td>{fmt(i.liberacaoPCP)}</td>
              <td>{fmt(i.dataEntrega)}</td>
              <td className="col-num">
                {i.diasAteEntrega !== null ? (
                  <span
                    className={`badge-dias ${
                      i.diasAteEntrega > 30 ? "alerta" : "ok"
                    }`}
                  >
                    {i.diasAteEntrega}
                  </span>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
