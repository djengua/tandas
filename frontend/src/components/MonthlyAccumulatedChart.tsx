"use client";

import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler } from "chart.js";
import Card from "@/components/ui/Card";
import type { MontoMes } from "@/types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

interface MonthlyAccumulatedChartProps {
  data: MontoMes[];
}

export default function MonthlyAccumulatedChart({ data }: MonthlyAccumulatedChartProps) {
  if (!data || data.length === 0) return null;

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: "Monto Acumulado",
        data: data.map((d) => d.monto),
        fill: true,
        borderColor: "#4f46e5",
        backgroundColor: "rgba(79, 70, 229, 0.1)",
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        grid: { color: "#f3f4f6" },
        ticks: {
          callback: (value: any) => `$${value}`,
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => `$${context.raw.toFixed(2)}`,
        },
      },
    },
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Monto Acumulado por Mes</h2>
      <div className="h-[200px]">
        <Line data={chartData} options={options} />
      </div>
    </Card>
  );
}