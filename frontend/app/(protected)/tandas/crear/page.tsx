"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tandasApi } from "@/api/tandas";
import {
  AlertTriangle,
  ArrowLeft,
  PiggyBank,
  DollarSign,
  Wallet,
  Save,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const PERIOD_DAYS: Record<string, number> = {
  semanal: 7,
  quincenal: 15,
  mensual: 30,
};

const PERIOD_LABELS: Record<string, string> = {
  semanal: "semanal",
  quincenal: "quincenal",
  mensual: "mensual",
};

const TIPO_TANDA_OPTIONS = [
  {
    value: "clasico",
    label: "Clasico",
    icon: PiggyBank,
    description: "Un participante recibe por ronda",
  },
  {
    value: "caja_ahorro",
    label: "Caja de Ahorro",
    icon: Wallet,
    description: "Todos reciben al final",
  },
];

function calcularRondas(inicio: string, fin: string, periodo: string): number {
  if (!inicio || !fin) return 2;
  const d1 = new Date(inicio);
  const d2 = new Date(fin);
  const days = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
  if (days < 1) return 0;
  const pd = PERIOD_DAYS[periodo] || 7;
  return Math.max(Math.floor(days / pd) + 1, 2);
}

function calcularFechaFinAjustada(
  inicio: string,
  numeroRondas: number,
  periodo: string,
): string {
  if (!inicio || numeroRondas < 2) return "";
  const d1 = new Date(inicio);
  const pd = PERIOD_DAYS[periodo] || 7;
  const d2 = new Date(d1);
  d2.setDate(d2.getDate() + pd * (numeroRondas - 1));
  return d2.toISOString().split("T")[0];
}

export default function CreateTandaPage() {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [tipoPeriodo, setTipoPeriodo] = useState("semanal");
  const [tipoTanda, setTipoTanda] = useState("clasico");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [numParticipantesInput, setNumParticipantesInput] = useState("0");
  const navigate = useRouter();
  const queryClient = useQueryClient();

  const numRondas = useMemo(() => {
    if (tipoTanda === "clasico" && numParticipantesInput) {
      return parseInt(numParticipantesInput);
    }
    return calcularRondas(fechaInicio, fechaFin, tipoPeriodo);
  }, [tipoTanda, numParticipantesInput, fechaInicio, fechaFin, tipoPeriodo]);

  const fechaFinAjustada = useMemo(
    () => calcularFechaFinAjustada(fechaInicio, numRondas, tipoPeriodo),
    [fechaInicio, numRondas, tipoPeriodo],
  );

  const warning = useMemo(() => {
    if (!fechaFin || !fechaFinAjustada || fechaFin === fechaFinAjustada)
      return null;
    const pd = PERIOD_DAYS[tipoPeriodo] || 7;
    const label = PERIOD_LABELS[tipoPeriodo] || tipoPeriodo;
    return (
      `La fecha final se ajustará a ${fechaFinAjustada.split("-").reverse().join("/")} ` +
      `para alinearse con la periodicidad ${label} (cada ${pd} días)`
    );
  }, [fechaFin, fechaFinAjustada, tipoPeriodo]);

  const mutation = useMutation({
    mutationFn: tandasApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tandas"] });
      navigate.push(`/tandas/${data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      nombre,
      descripcion: descripcion || undefined,
      monto_periodo: parseFloat(monto),
      tipo_periodo: tipoPeriodo as any,
      tipo_tanda: tipoTanda,
      num_rondas:
        tipoTanda === "clasico" ? parseInt(numParticipantesInput) : undefined,
      fecha_inicio: fechaInicio + "T00:00:00",
      fecha_fin: (fechaFinAjustada || fechaFin) + "T00:00:00",
    });
  };

  return (
    <div className="max-w-xl mx-auto animate-fade-in">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Volver
      </Link>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-100 mb-3">
          <PiggyBank className="w-6 h-6 text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Crear Nueva Tanda</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configura los detalles de tu tanda de ahorro
        </p>
      </div>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label-base">Nombre de la tanda</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="input-base"
              placeholder="Ej: Ahorro grupal 2026"
            />
          </div>
          <div>
            <label className="label-base">Descripcion (opcional)</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="input-base"
              placeholder="Breve descripcion de la tanda..."
            />
          </div>

          <div>
            <label className="label-base">Tipo de tanda</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TIPO_TANDA_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = tipoTanda === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTipoTanda(opt.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${isSelected ? "bg-primary-200" : "bg-gray-100"}`}
                      >
                        <Icon
                          className={`w-5 h-5 ${isSelected ? "text-primary-700" : "text-gray-600"}`}
                        />
                      </div>
                      <div>
                        <div
                          className={`font-semibold ${isSelected ? "text-primary-700" : "text-gray-900"}`}
                        >
                          {opt.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {opt.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-base">Monto por período ($)</label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="input-base"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="label-base">Período</label>
              <select
                value={tipoPeriodo}
                onChange={(e) => setTipoPeriodo(e.target.value)}
                className="input-base"
              >
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-base">Fecha de inicio</label>
              <input
                type="date"
                required
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="input-base"
              />
            </div>
            {tipoTanda === "clasico" ? (
              <div>
                <label className="label-base">Numero de participantes</label>
                <input
                  type="number"
                  required
                  min="2"
                  value={numParticipantesInput}
                  onChange={(e) => setNumParticipantesInput(e.target.value)}
                  className="input-base"
                  placeholder="2-50"
                />
              </div>
            ) : (
              <div>
                <label className="label-base">Fecha de fin</label>
                <input
                  type="date"
                  required
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="input-base"
                />
              </div>
            )}
          </div>

          <div
            className={`rounded-xl p-5 border ${warning ? "bg-amber-50 border-amber-200" : "bg-primary-50 border-primary-100"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">
                {tipoTanda === "clasico"
                  ? "Participantes"
                  : "Rondas calculadas"}
              </span>
              <span className="text-3xl font-bold text-primary-600">
                {numRondas}
              </span>
            </div>

            <p className="text-xs text-gray-500">
              {fechaInicio && monto
                ? tipoTanda === "caja_ahorro" && fechaFin
                  ? `~ $${(parseFloat(monto) * numRondas).toFixed(2)} total pool ($${parseFloat(monto).toFixed(2)} x ${numRondas} rondas)`
                  : `~ $${(parseFloat(monto) * numRondas).toFixed(2)} por participante ($${parseFloat(monto).toFixed(2)} x ${numRondas} rondas)`
                : "Selecciona las fechas y el monto para calcular"}
            </p>
            {warning && (
              <div className="flex items-start gap-2.5 mt-3 text-xs text-amber-800 bg-amber-100/80 p-3 rounded-lg">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                <span>{warning}</span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            loading={mutation.isPending}
            className="w-full"
            icon={<DollarSign className="w-4 h-4" />}
          >
            {mutation.isPending ? "Creando..." : "Crear Tanda"}
          </Button>

          {mutation.isError && (
            <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-sm border border-red-100">
              {(mutation.error as any)?.response?.data?.detail ||
                "Error al crear la tanda"}
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
