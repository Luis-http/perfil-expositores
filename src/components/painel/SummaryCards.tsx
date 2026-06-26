import type { Implantado, Pipeline } from "../../types";
import "./SummaryCards.css";

interface Props {
  implantados: Implantado[];
  pipeline: Pipeline[];
}

export default function SummaryCards({ implantados, pipeline }: Props) {
  const totalImplantados = implantados.reduce((s, i) => s + i.quantidade, 0);
  const totalPipeline = pipeline.reduce((s, p) => s + p.quantidade, 0);
  const prontos = pipeline
    .filter((p) => p.status === "Implantar")
    .reduce((s, p) => s + p.quantidade, 0);

  const comPrazo = implantados.filter(
    (i) => i.diasAteEntrega !== null && i.diasAteEntrega >= 0
  );
  const prazoMedio =
    comPrazo.length > 0
      ? Math.round(
          comPrazo.reduce((s, i) => s + (i.diasAteEntrega ?? 0), 0) /
            comPrazo.length
        )
      : null;

  const cards = [
    {
      label: "Implantados no período",
      valor: totalImplantados,
      sub: `${implantados.length} pedidos`,
      cor: "#1f3a5f",
      icon: "✅",
    },
    {
      label: "Total a entrar (pipeline)",
      valor: totalPipeline,
      sub: `${pipeline.length} clientes`,
      cor: "#2980b9",
      icon: "🔄",
    },
    {
      label: "Prontos para implantar",
      valor: prontos,
      sub: "status: Implantar",
      cor: "#27ae60",
      icon: "🚀",
    },
    {
      label: "Prazo médio (dias)",
      valor: prazoMedio !== null ? prazoMedio : "—",
      sub: "entrega − lib. PCP",
      cor: prazoMedio !== null && prazoMedio > 30 ? "#e67e22" : "#16a085",
      icon: "📅",
    },
  ];

  return (
    <div className="summary-cards">
      {cards.map((c) => (
        <div className="summary-card" key={c.label} style={{ borderTopColor: c.cor }}>
          <div className="summary-icon">{c.icon}</div>
          <div className="summary-value" style={{ color: c.cor }}>
            {c.valor}
          </div>
          <div className="summary-label">{c.label}</div>
          <div className="summary-sub">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
