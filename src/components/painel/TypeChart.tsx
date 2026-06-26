import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { Implantado } from "../../types";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const CORES_TIPO = [
  "#1f3a5f", "#2980b9", "#27ae60", "#e67e22", "#8e44ad", "#16a085",
];

interface Props {
  implantados: Implantado[];
}

export default function TypeChart({ implantados }: Props) {
  const totais: Record<string, number> = {};
  for (const i of implantados) {
    totais[i.tipo] = (totais[i.tipo] ?? 0) + i.quantidade;
  }

  const tipos = Object.keys(totais).sort();
  const valores = tipos.map((t) => totais[t]);

  const data = {
    labels: tipos,
    datasets: [
      {
        label: "Expositores",
        data: valores,
        backgroundColor: tipos.map((_, i) => CORES_TIPO[i % CORES_TIPO.length]),
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    indexAxis: "y" as const,
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };

  if (tipos.length === 0) {
    return <p style={{ color: "#718096", textAlign: "center", padding: "2rem" }}>Sem dados no período</p>;
  }

  return <Bar data={data} options={options} />;
}
