import type { Pipeline } from "../../types";
import "./PipelineGroup.css";

interface Props {
  status: string;
  itens: Pipeline[];
  cor: string;
}

function fmt(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("pt-BR");
}

export default function PipelineGroup({ status, itens, cor }: Props) {
  const subtotal = itens.reduce((s, p) => s + p.quantidade, 0);

  return (
    <div className="pipeline-group" style={{ borderLeftColor: cor }}>
      <div className="pipeline-group-header" style={{ backgroundColor: cor + "18" }}>
        <span className="pipeline-status-badge" style={{ backgroundColor: cor }}>
          {status}
        </span>
        <span className="pipeline-subtotal">
          {subtotal} expositor{subtotal !== 1 ? "es" : ""} · {itens.length} cliente{itens.length !== 1 ? "s" : ""}
        </span>
      </div>
      <table className="pipeline-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Tipo</th>
            <th className="col-num">Qtd</th>
            <th>Entrega prevista</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((p, idx) => (
            <tr key={idx}>
              <td>{p.cliente}</td>
              <td>
                <span className="badge-tipo-pipe">{p.tipo}</span>
              </td>
              <td className="col-num">{p.quantidade}</td>
              <td>{fmt(p.dataEntrega)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} className="subtotal-label">Subtotal</td>
            <td className="col-num subtotal-valor">{subtotal}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
