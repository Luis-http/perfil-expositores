import type { Pipeline } from "../../types";
import { STATUS_COLORS, STATUS_ORDER } from "../../config";
import "./StatusChart.css";

interface Props {
  pipeline: Pipeline[];
}

export default function StatusChart({ pipeline }: Props) {
  // Agrupa por status somando quantidade e contando clientes
  const grupos: Record<string, { qtd: number; clientes: number }> = {};
  for (const p of pipeline) {
    if (!grupos[p.status]) grupos[p.status] = { qtd: 0, clientes: 0 };
    grupos[p.status].qtd += p.quantidade;
    grupos[p.status].clientes += 1;
  }

  const labels = [
    ...STATUS_ORDER.filter((s) => s in grupos),
    ...Object.keys(grupos).filter((s) => !STATUS_ORDER.includes(s)),
  ];

  const totalQtd = Object.values(grupos).reduce((s, g) => s + g.qtd, 0);

  if (labels.length === 0) {
    return <p className="status-vazio">Pipeline vazio</p>;
  }

  return (
    <div className="status-cards">
      {labels.map((label) => {
        const { qtd, clientes } = grupos[label];
        const pct = totalQtd > 0 ? Math.round((qtd / totalQtd) * 100) : 0;
        const cor = STATUS_COLORS[label] ?? "#95a5a6";

        return (
          <div className="status-card" key={label}>
            <div className="status-card-header">
              <span className="status-badge" style={{ background: cor }}>
                {label}
              </span>
              <span className="status-pct" style={{ color: cor }}>{pct}%</span>
            </div>
            <div className="status-bar-bg">
              <div
                className="status-bar-fill"
                style={{ width: `${pct}%`, background: cor }}
              />
            </div>
            <div className="status-card-footer">
              <span className="status-num">{qtd} expositor{qtd !== 1 ? "es" : ""}</span>
              <span className="status-clientes">{clientes} cliente{clientes !== 1 ? "s" : ""}</span>
            </div>
          </div>
        );
      })}

      <div className="status-total">
        Total: <strong>{totalQtd}</strong> expositores · <strong>{pipeline.length}</strong> clientes
      </div>
    </div>
  );
}
