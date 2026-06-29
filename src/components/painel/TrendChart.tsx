import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { Implantado } from "../../types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Props {
  implantados: Implantado[];
}

export default function TrendChart({ implantados }: Props) {
  const hoje = new Date();
  const meses: string[] = [];
  const quantidades: number[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const label = d.toLocaleString("pt-BR", { month: "short", year: "2-digit" });
    meses.push(label);
    const total = implantados
      .filter((imp) => {
        if (!imp.dataEntrega) return false;
        return (
          imp.dataEntrega.getFullYear() === d.getFullYear() &&
          imp.dataEntrega.getMonth() === d.getMonth()
        );
      })
      .reduce((s, imp) => s + imp.quantidade, 0);
    quantidades.push(total);
  }

  const data = {
    labels: meses,
    datasets: [
      {
        label: "Expositores implantados",
        data: quantidades,
        backgroundColor: "rgba(31, 58, 95, 0.75)",
        borderColor: "#1f3a5f",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { maxTicksLimit: 6 },
        grid: { color: "rgba(0,0,0,0.05)" },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  return <Bar data={data} options={options} />;
}
