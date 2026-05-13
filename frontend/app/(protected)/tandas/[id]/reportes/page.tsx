'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { tandasApi } from '@/api/tandas';
import { ArrowLeft, DollarSign, Users, CheckCircle, BarChart3, Download } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ExportPdfButton from '@/components/ExportPdfButton';
import RoundsProgressChart from '@/components/RoundsProgressChart';
import MonthlyAccumulatedChart from '@/components/MonthlyAccumulatedChart';
import Timeline from '@/components/Timeline';

export default function ReportsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

const { data: report, isLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: () => tandasApi.getReport(id!),
    enabled: !!id,
  });

  const { data: activities } = useQuery({
    queryKey: ['report-activities', id],
    queryFn: () => tandasApi.getReportActivities(id!),
    enabled: !!id,
  });

  const handleExportCsv = () => {
    if (id) tandasApi.exportReportCsv(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }
  if (!report) return <div className="text-center py-8 text-red-500">Reporte no disponible</div>;

  return (
    <div className="animate-fade-in space-y-6">
      <button onClick={() => router.push(`/tandas/${id}`)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver a la tanda
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold text-gray-900">Reporte</h1>
          <p className="text-sm text-gray-500 mt-1">{report.tanda_nombre}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExportCsv} icon={<Download className="w-4 h-4" />}>
            CSV
          </Button>
          <ExportPdfButton tandaId={id!} report={report} />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-2 text-primary-600 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recaudado</span>
          </div>
          <p className="text-xl font-bold text-gray-900">${report.total_recaudado.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-0.5">de ${report.monto_esperado.toFixed(2)}</p>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Completado</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{report.porcentaje_completado}%</p>
          <p className="text-xs text-gray-400 mt-0.5">{report.rondas_cobradas}/{report.total_rondas} rondas</p>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Participantes</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{report.total_participantes}</p>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-2 text-yellow-600 mb-2">
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pagos</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{report.pagos_completados}/{report.total_pagos}</p>
          <p className="text-xs text-gray-400 mt-0.5">{report.pagos_pendientes} pendientes</p>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Detalle por Participante</h2>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-3 pl-6 font-medium text-gray-400 uppercase tracking-wide text-xs text-left">#</th>
                <th className="pb-3 font-medium text-gray-400 uppercase tracking-wide text-xs text-left">Participante</th>
                <th className="pb-3 font-medium text-gray-400 uppercase tracking-wide text-xs text-left">Avance</th>
                <th className="pb-3 font-medium text-gray-400 uppercase tracking-wide text-xs text-left">Pagado</th>
                <th className="pb-3 pr-6 font-medium text-gray-400 uppercase tracking-wide text-xs text-left">Debe</th>
              </tr>
            </thead>
            <tbody>
              {report.detalle_participantes.map((p) => {
                const saldo = p.pagos_pendientes * report.monto_periodo;
                return (
                  <tr key={p.participante_id} className="border-b last:border-0 border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 pl-6 text-gray-500">{p.orden || '-'}</td>
                    <td className="py-3.5 font-medium text-gray-900">{p.nombre_display || '—'}</td>
                    <td className="py-3.5 pr-8 min-w-[160px]">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${p.pagos_pendientes > 0 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${report.total_rondas ? (p.pagos_hechos / report.total_rondas) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 font-medium shrink-0 w-10 text-right tabular-nums">{p.pagos_hechos}/{report.total_rondas}</span>
                      </div>
                    </td>
                    <td className="py-3.5 font-medium text-gray-900">${p.monto_pagado.toFixed(2)}</td>
                    <td className="py-3.5 pr-6">
                      {saldo > 0 ? (
                        <span className="font-medium text-red-600">${saldo.toFixed(2)}</span>
                      ) : (
                        <span className="text-green-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {report.rondas_data && report.rondas_data.length > 0 && (
        <RoundsProgressChart roundsData={report.rondas_data} />
      )}

      {report.monto_acumulado_mes && report.monto_acumulado_mes.length > 0 && (
        <MonthlyAccumulatedChart data={report.monto_acumulado_mes} />
      )}

      {activities && activities.length > 0 && (
        <Timeline activities={activities} />
      )}
    </div>
  );
}