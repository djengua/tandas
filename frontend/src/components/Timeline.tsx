"use client";

import { Clock } from "lucide-react";
import Card from "@/components/ui/Card";

interface ActivityItem {
  type: "pago" | "ronda" | "participante";
  description: string;
  timestamp?: string;
}

interface TimelineProps {
  activities: ActivityItem[];
}

export default function Timeline({ activities }: TimelineProps) {
  if (!activities || activities.length === 0) {
    return (
      <Card>
        <div className="flex items-center gap-2 text-gray-500">
          <Clock className="w-4 h-4" />
          <span className="text-sm">Sin actividad reciente</span>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h2>
      <div className="space-y-4 max-h-[300px] overflow-y-auto">
        {activities.map((activity, index) => (
          <div key={index} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  activity.type === "pago"
                    ? "bg-green-500"
                    : activity.type === "ronda"
                    ? "bg-blue-500"
                    : "bg-purple-500"
                }`}
              />
              {index < activities.length - 1 && (
                <div className="w-0.5 h-full bg-gray-200" />
              )}
            </div>
            <div className="pb-3">
              <p className="text-sm text-gray-900">{activity.description}</p>
              {activity.timestamp && (
                <p className="text-xs text-gray-400">{activity.timestamp}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}