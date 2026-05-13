"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tandasApi } from "@/api/tandas";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { formatMexicoDate } from "@/utils/date";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function RoundDetailPage() {
  const { id, roundId } = useParams<{ id: string; roundId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: tanda, isLoading: tandaLoading } = useQuery({
    queryKey: ["tanda", id],
    queryFn: () => tandasApi.get(id!),
    enabled: !!id,
  });

  const { data: round, isLoading, error } = useQuery({
    queryKey: ["round", id, roundId],
    queryFn: () => tandasApi.getRound(id!, roundId!),
    enabled: !!id && !!roundId,
  });

  const paymentMutation = useMutation({
    mutationFn: (pid: string) => tandasApi.registerPayment(id!, roundId!, pid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["round", id, roundId] });
      queryClient.invalidateQueries({ queryKey: ["rounds", id] });
    },
  });

  const isCajaAhorro = tanda?.tipo_tanda === "caja_ahorro";

  if (tandaLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }
  if (error)
    return (
      <div className="text-center py-8 text-red-500">
        {(error as any)?.response?.data?.detail || "Error al cargar la ronda"}
      </div>
    );
  if (!round)
    return (
      <div className="text-center py-8 text-red-500">Ronda no encontrada</div>
    );

  return (
    <div className="animate-fade-in space-y-6">
      <button
        onClick={() => router.push(`/tandas/${id}`)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a la tanda
      </button>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">
                Ronda #{round.numero}
              </h1>
              <Badge
                theme={
                  round.pagada
                    ? "green"
                    : round.estado === "cobrada"
                      ? "blue"
                      : "yellow"
                }
                size="sm"
                dot
              >
                {round.pagada ? "Pagada" : capitalize(round.estado)}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">
              Fecha límite: {formatMexicoDate(round.fecha_limite)}
            </p>
          </div>
          <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-xl">
            Cobra:{" "}
            <span className="font-medium text-gray-700">
              {round.cobrador_nombre || "—"}
            </span>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Pagos</h2>
        {round.pagos && round.pagos.length > 0 ? (
          <div className="space-y-2">
            {round.pagos.map((pago) => (
              <div
                key={pago.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 hover:bg-gray-100/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {pago.estado === "pagado" ? (
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
                      <XCircle className="w-5 h-5 text-yellow-600" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {pago.participante_nombre || "Participante"}
                    </p>
                    <p className="text-xs text-gray-500">
                      ${pago.monto.toFixed(2)}
                      {pago.fecha_pago && ` · ${new Date(pago.fecha_pago).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    theme={pago.estado === "pagado" ? "green" : "yellow"}
                    size="sm"
                  >
                    {capitalize(pago.estado)}
                  </Badge>
                  {pago.estado === "pendiente" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        paymentMutation.mutate(pago.participante_id)
                      }
                      disabled={paymentMutation.isPending}
                      loading={paymentMutation.isPending}
                    >
                      Registrar como pagado
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-gray-500">
            No hay pagos registrados
          </div>
        )}
      </Card>
    </div>
  );
}