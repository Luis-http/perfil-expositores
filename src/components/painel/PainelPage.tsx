import { useState, useMemo, Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import type { Implantado, Pipeline } from "../../types";
import SummaryCards from "./SummaryCards";
import TrendChart from "./TrendChart";
import TypeChart from "./TypeChart";
import StatusChart from "./StatusChart";
import "./PainelPage.css";

interface Props {
  implantados: Implantado[];
  pipeline: Pipeline[];
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const hoje = startOfDay(new Date());

const ATALHOS = [
  { label: "Última semana", fn: () => ({ de: addDays(hoje, -7), ate: hoje }) },
  { label: "2 semanas", fn: () => ({ de: addDays(hoje, -14), ate: hoje }) },
  { label: "3 meses", fn: () => ({ de: addDays(hoje, -90), ate: hoje }) },
  { label: "Semestre", fn: () => ({ de: addDays(hoje, -180), ate: hoje }) },
  { label: "1 ano", fn: () => ({ de: addDays(hoje, -365), ate: hoje }) },
  { label: "Tudo", fn: () => ({ de: null, ate: null }) },
];

function toInputDate(d: Date | null) {
  if (!d) return "";
  return d.toISOString().split("T")[0];
}

class ChartBoundary extends Component<{ label: string; children: ReactNode }, { error: boolean }> {
  state = { error: false };
  componentDidCatch(_: Error, __: ErrorInfo) {
    this.setState({ error: true });
  }
  render() {
    if (this.state.error)
      return <div className="chart-error">Erro ao carregar {this.props.label}</div>;
    return this.props.children;
  }
}

export default function PainelPage({ implantados, pipeline }: Props) {
  const [de, setDe] = useState<Date | null>(addDays(hoje, -365));
  const [ate, setAte] = useState<Date | null>(hoje);
  const [atalhoAtivo, setAtalhoAtivo] = useState("1 ano");

  const filtrados = useMemo(() =>
    implantados.filter((i) => {
      if (!i.dataEntrega) return false;
      if (de && i.dataEntrega < de) return false;
      if (ate && i.dataEntrega > ate) return false;
      return true;
    }), [implantados, de, ate]);

  const handleAtalho = (label: string, fn: () => { de: Date | null; ate: Date | null }) => {
    const { de: nd, ate: na } = fn();
    setDe(nd);
    setAte(na);
    setAtalhoAtivo(label);
  };

  const handleDe = (val: string) => {
    setDe(val ? new Date(val + "T00:00:00") : null);
    setAtalhoAtivo("");
  };

  const handleAte = (val: string) => {
    setAte(val ? new Date(val + "T00:00:00") : null);
    setAtalhoAtivo("");
  };

  return (
    <div className="painel-page">
      {/* Filtro de período */}
      <div className="periodo-bar">
        <div className="periodo-campos">
          <div className="date-field">
            <span className="date-label">De</span>
            <div className="date-input-wrap">
              <input
                type="date"
                className="date-input"
                value={toInputDate(de)}
                onChange={(e) => handleDe(e.target.value)}
              />
              <span className="date-icon">📅</span>
            </div>
          </div>
          <div className="date-separator">→</div>
          <div className="date-field">
            <span className="date-label">Até</span>
            <div className="date-input-wrap">
              <input
                type="date"
                className="date-input"
                value={toInputDate(ate)}
                onChange={(e) => handleAte(e.target.value)}
              />
              <span className="date-icon">📅</span>
            </div>
          </div>
        </div>
        <div className="periodo-atalhos">
          {ATALHOS.map((a) => (
            <button
              key={a.label}
              className={`atalho-btn ${atalhoAtivo === a.label ? "ativo" : ""}`}
              onClick={() => handleAtalho(a.label, a.fn)}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards de resumo */}
      <ChartBoundary label="resumo">
        <SummaryCards implantados={filtrados} pipeline={pipeline} />
      </ChartBoundary>

      {/* Gráficos */}
      <div className="charts-grid">
        <div className="chart-card wide">
          <h3>Tendência mensal — Implantados (últimos 12 meses)</h3>
          <ChartBoundary label="tendência">
            <TrendChart implantados={implantados} />
          </ChartBoundary>
        </div>
        <div className="chart-card">
          <h3>Implantados por tipo no período</h3>
          <ChartBoundary label="por tipo">
            <TypeChart implantados={filtrados} />
          </ChartBoundary>
        </div>
        <div className="chart-card">
          <h3>Pipeline por status</h3>
          <ChartBoundary label="pipeline">
            <StatusChart pipeline={pipeline} />
          </ChartBoundary>
        </div>
      </div>
    </div>
  );
}
