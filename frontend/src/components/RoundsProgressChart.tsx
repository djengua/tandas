"use client";

import Card from "@/components/ui/Card";
import type { RondaProgress } from "@/types";

interface RoundsProgressChartProps {
  roundsData: RondaProgress[];
}

export default function RoundsProgressChart({ roundsData }: RoundsProgressChartProps) {
  console.log("DEBUG roundsData:", roundsData);
  
  if (!roundsData || !Array.isArray(roundsData) || roundsData.length === 0) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Progreso por Ronda</h2>
        <p className="text-gray-500 py-8 text-center">No hay datos de rondas</p>
      </Card>
    );
  }

  const getColor = (pct: number | undefined) => {
    console.log("DEBUG getColor pct:", pct, "type:", typeof pct);
    if (!pct) return "bg-red-500";
    const result = pct >= 100 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500";
    console.log("DEBUG getColor result:", result);
    return result;
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Progreso por Ronda</h2>
      <div className="space-y-3">
        {roundsData.map((ronda) => (
          <div key={ronda.numero} className="flex items-center gap-3">
            <div className="w-10 text-sm font-medium text-gray-600">
              R{ronda.numero}
            </div>
            <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${getColor(ronda.porcentaje)}`}
                style={{ width: `${ronda.porcentaje}%` }}
              />
            </div>
            <div className="w-20 text-sm text-right font-medium">
              {ronda.porcentaje}%
            </div>
            <div className="w-24 text-xs text-gray-500 text-right">
              {ronda.pagos_recibidos}/{ronda.total_participantes}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-500">100%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-gray-500">50-99%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-gray-500">&lt;50%</span>
          </div>
        </div>
      </div>
    </Card>
  );
}