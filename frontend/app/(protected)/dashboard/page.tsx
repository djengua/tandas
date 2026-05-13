'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { tandasApi } from '@/api/tandas';
import { PlusCircle, Users, Calendar, Clock, CheckCircle, XCircle, PiggyBank, Search, Wallet } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import type { Tanda } from '@/types';

type FilterKey = 'todas' | 'pendiente' | 'activa' | 'completada';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'activa', label: 'Activas' },
  { key: 'completada', label: 'Completadas' },
];

const badgeTheme: Record<string, 'yellow' | 'green' | 'blue' | 'red'> = {
  pendiente: 'yellow',
  activa: 'green',
  completada: 'blue',
  cancelada: 'red',
};

const statusIcons: Record<string, JSX.Element> = {
  activa: <CheckCircle className="w-4 h-4 text-green-500" />,
  pendiente: <Clock className="w-4 h-4 text-yellow-500" />,
  completada: <CheckCircle className="w-4 h-4 text-blue-500" />,
  cancelada: <XCircle className="w-4 h-4 text-red-500" />,
};

const statusLabels: Record<string, string> = {
  activa: 'En progreso',
  pendiente: 'Por iniciar',
  completada: 'Finalizada',
  cancelada: 'Cancelada',
};

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function DashboardPage() {
  const [filter, setFilter] = useState<FilterKey>('todas');
  const { data: tandas, isLoading } = useQuery({
    queryKey: ['tandas'],
    queryFn: tandasApi.list,
  });

  const filtered = tandas?.filter((t) => filter === 'todas' || t.estado === filter) ?? [];

const counts = {
    todas: tandas?.length ?? 0,
    pendiente: tandas?.filter((t: any) => t.estado === 'pendiente').length ?? 0,
    activa: tandas?.filter((t: any) => t.estado === 'activa').length ?? 0,
    completada: tandas?.filter((t: any) => t.estado === 'completada').length ?? 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Tandas</h1>
          <p className="text-sm text-gray-500 mt-1">{counts.todas} tanda{counts.todas !== 1 ? 's' : ''} registrada{counts.todas !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/tandas/crear">
          <Button icon={<PlusCircle className="w-4 h-4" />}>Nueva Tanda</Button>
        </Link>
      </div>

      {!tandas || tandas.length === 0 ? (
        <Card className="text-center py-16">
          <EmptyState
            icon={<PiggyBank className="w-8 h-8" />}
            title="No tienes tandas todavía"
            description="Crea tu primera tanda para empezar a gestionar tus ahorros."
            action={
              <Link href="/tandas/crear">
                <Button icon={<PlusCircle className="w-4 h-4" />}>Crear mi primera tanda</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`shrink-0 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f.key
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {f.label}
                {counts[f.key] > 0 && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                    filter === f.key ? 'bg-white/20' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {counts[f.key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <Card className="text-center py-12">
              <EmptyState
                icon={<Search className="w-8 h-8" />}
                title="Sin resultados"
                description={`No hay tandas con el estado "${filter}".`}
              />
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((t: Tanda) => (
                <Link key={t.id} href={`/tandas/${t.id}`} className="group block">
                  <Card hover className="h-full transition-all duration-200 group-hover:-translate-y-0.5">
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">{t.nombre}</h3>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${t.tipo_tanda === 'caja_ahorro' ? 'bg-green-100 text-green-700' : 'bg-primary-100 text-primary-700'}`}>
                          {t.tipo_tanda === 'caja_ahorro' ? 'Caja' : 'Clasico'}
                        </span>
                        <Badge theme={badgeTheme[t.estado] || 'gray'} size="sm">{capitalize(t.estado)}</Badge>
                      </div>
                    </div>
                    {t.descripcion && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{t.descripcion}</p>
                    )}
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400 shrink-0" />
                        {t.tipo_tanda === 'caja_ahorro' ? (
                          <span>{t.participantes_count ?? 0} participantes</span>
                        ) : (
                          <span>{t.participantes_count ?? 0}/{t.num_rondas} participantes</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>${t.monto_periodo.toFixed(2)} / {t.tipo_periodo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {statusIcons[t.estado] || <Clock className="w-4 h-4 text-gray-300" />}
                        <span className="text-gray-500">{capitalize(statusLabels[t.estado] || t.estado)}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
