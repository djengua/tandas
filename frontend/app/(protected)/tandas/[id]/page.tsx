"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tandasApi } from "@/api/tandas";
import { usersApi } from "@/api/users";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatMexicoDate } from "@/utils/date";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import {
  Users,
  Calendar,
  DollarSign,
  Shuffle,
  Play,
  Trash2,
  ArrowLeft,
  UserPlus,
  BarChart3,
  Search,
  UserCheck,
  UserIcon,
  Clock,
  AlertTriangle,
  PiggyBank,
  CheckCircle,
} from "lucide-react";

const estadoBadge: Record<string, "yellow" | "green" | "blue" | "red"> = {
  pendiente: "yellow",
  activa: "green",
  completada: "blue",
  cancelada: "red",
};

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function TandaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState<"buscar" | "invitado">("buscar");
  const [searchEmail, setSearchEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  const { data: tanda, isLoading } = useQuery({
    queryKey: ["tanda", id],
    queryFn: () => tandasApi.get(id!),
    enabled: !!id,
  });

  const { data: participants, refetch: refetchParticipants } = useQuery({
    queryKey: ["participants", id],
    queryFn: () => tandasApi.getParticipants(id!),
    enabled: !!id,
  });

  const { data: rounds } = useQuery({
    queryKey: ["rounds", id],
    queryFn: () => tandasApi.getRounds(id!),
    enabled: !!id,
  });

  const { data: searchResults, isFetching: searching } = useQuery({
    queryKey: ["users-search", searchEmail],
    queryFn: () => usersApi.search(searchEmail),
    enabled: searchEmail.length >= 2,
  });

  const sortMutation = useMutation({
    mutationFn: () => tandasApi.sortear(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tanda", id] });
      refetchParticipants();
    },
  });

  const startMutation = useMutation({
    mutationFn: () => tandasApi.iniciar(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tanda", id] });
      queryClient.invalidateQueries({ queryKey: ["rounds", id] });
      queryClient.invalidateQueries({ queryKey: ["participants", id] });
    },
  });

  const pagarMutation = useMutation({
    mutationFn: (roundId: string) => tandasApi.pagarRonda(id!, roundId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tanda", id] });
      queryClient.invalidateQueries({ queryKey: ["rounds", id] });
    },
  });

  const removeParticipantMutation = useMutation({
    mutationFn: (pid: string) => tandasApi.removeParticipant(id!, pid),
    onSuccess: () => refetchParticipants(),
  });

  const addParticipantMutation = useMutation({
    mutationFn: (data: {
      usuario_id?: string;
      nombre_invitado?: string;
      email_invitado?: string;
    }) => tandasApi.addParticipant(id!, data),
    onSuccess: () => {
      refetchParticipants();
      setShowModal(false);
      setSearchEmail("");
      setGuestName("");
      setGuestEmail("");
    },
  });

  const orderMutation = useMutation({
    mutationFn: ({ pid, orden }: { pid: string; orden: number }) =>
      tandasApi.updateParticipant(id!, pid, { orden }),
    onSuccess: () => {
      refetchParticipants();
      queryClient.invalidateQueries({ queryKey: ["tanda", id] });
    },
  });

  const [editedOrders, setEditedOrders] = useState<Record<string, string>>({});

  const handleOrderChange = useCallback((pid: string, value: string) => {
    setEditedOrders((prev) => ({ ...prev, [pid]: value }));
  }, []);

  const handleOrderBlur = useCallback(
    (pid: string) => {
      const val = editedOrders[pid];
      if (val !== undefined && val !== "" && !isNaN(Number(val))) {
        orderMutation.mutate({ pid, orden: Number(val) });
      }
      setEditedOrders((prev) => {
        const next = { ...prev };
        delete next[pid];
        return next;
      });
    },
    [editedOrders, orderMutation],
  );

  const sortedParticipants = [...(participants || [])].sort((a, b) => {
    if (a.orden && b.orden) return a.orden - b.orden;
    if (a.orden) return -1;
    if (b.orden) return 1;
    return 0;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }
  if (!tanda)
    return (
      <div className="text-center py-8 text-red-500">Tanda no encontrada</div>
    );

  const participantIds = new Set((participants || []).map((p) => p.usuario_id));

  const handleAddRegistered = (userId: string) => {
    addParticipantMutation.mutate({ usuario_id: userId });
  };

  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName) return;
    addParticipantMutation.mutate({
      nombre_invitado: guestName,
      email_invitado: guestEmail || undefined,
    });
  };

  return (
    <div className="animate-fade-in space-y-6">
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver al dashboard
      </button>

      {tanda.advertencia && (
        <div className="flex items-start gap-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 p-4 rounded-xl">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-amber-500" />
          <span>{tanda.advertencia}</span>
        </div>
      )}

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 truncate">
                {tanda.nombre}
              </h1>
              <Badge theme={estadoBadge[tanda.estado] || "gray"} size="sm" dot>
                {capitalize(tanda.estado)}
              </Badge>
              <span className={`text-xs px-1.5 py-0.5 rounded ${tanda.tipo_tanda === 'caja_ahorro' ? 'bg-green-100 text-green-700' : 'bg-primary-100 text-primary-700'}`}>
                {tanda.tipo_tanda === 'caja_ahorro' ? 'Caja' : 'Clasico'}
              </span>
            </div>
            {tanda.descripcion && (
              <p className="text-sm text-gray-500">{tanda.descripcion}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4 text-primary-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                Monto
              </p>
              <p className="font-semibold text-gray-900">
                ${tanda.monto_periodo.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-primary-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                Período
              </p>
              <p className="font-semibold text-gray-900 capitalize">
                {tanda.tipo_periodo}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-primary-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                {tanda.tipo_tanda === "caja_ahorro" ? "Participantes" : "Participantes"}
              </p>
              <p className="font-semibold text-gray-900">
                {tanda.tipo_tanda === "caja_ahorro"
                  ? tanda.participantes_count
                  : `${tanda.participantes_count}/${tanda.num_rondas}`}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-primary-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                Duración
              </p>
              <p className="font-semibold text-gray-900 text-sm leading-tight">
                {tanda.fecha_inicio
                  ? formatMexicoDate(tanda.fecha_inicio)
                  : "—"}
                {tanda.fecha_fin
                  ? ` — ${formatMexicoDate(tanda.fecha_fin)}`
                  : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-gray-100">
          {tanda.estado === "pendiente" &&
            tanda.tipo_tanda !== "caja_ahorro" &&
            !tanda.orden_sorteado && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Shuffle className="w-4 h-4" />}
              onClick={() => sortMutation.mutate()}
              disabled={
                sortMutation.isPending || (participants?.length || 0) < 2
              }
              loading={sortMutation.isPending}
            >
              Sortear Orden
            </Button>
          )}
          {tanda.estado === "pendiente" && (
            <Button
              size="sm"
              icon={<Play className="w-4 h-4" />}
              onClick={() => startMutation.mutate()}
              disabled={
                startMutation.isPending || (participants?.length || 0) < 2
              }
              loading={startMutation.isPending}
            >
              Iniciar Tanda
            </Button>
          )}
          {(tanda.estado === "activa" || tanda.estado === "completada") && (
            <Link href={`/tandas/${id}/reportes`}>
              <Button
                variant="secondary"
                size="sm"
                icon={<BarChart3 className="w-4 h-4" />}
              >
                Reportes
              </Button>
            </Link>
          )}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Participantes
            </h2>
            {tanda.estado === "pendiente" &&
              (tanda.tipo_tanda === "caja_ahorro" ||
                tanda.participantes_count! < tanda.num_rondas!) && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<UserPlus className="w-4 h-4" />}
                  onClick={() => setShowModal(true)}
                >
                  Agregar
                </Button>
              )}
          </div>

          {tanda.estado === "pendiente" &&
            tanda.tipo_tanda !== "caja_ahorro" &&
            !tanda.orden_sorteado &&
            sortedParticipants.length > 0 && (
              <p className="text-xs text-gray-400 mb-4 bg-gray-50 rounded-lg px-3 py-2">
                Asigna el orden escribiendo un número en la casilla de cada
                participante (se guarda automáticamente al cambiar de campo)
              </p>
            )}

          {sortedParticipants.length > 0 ? (
            <div className="space-y-2">
              {sortedParticipants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100/60 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {tanda.estado === "pendiente" &&
                    tanda.tipo_tanda !== "caja_ahorro" &&
                    !tanda.orden_sorteado ? (
                      <input
                        type="number"
                        min={1}
                        max={participants?.length || 1}
                        value={editedOrders[p.id] ?? p.orden ?? ""}
                        onChange={(e) =>
                          handleOrderChange(p.id, e.target.value)
                        }
                        onBlur={() => handleOrderBlur(p.id)}
                        className="w-9 h-8 text-center text-sm font-semibold border-2 border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    ) : (
                      <span className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
                        {p.orden || "-"}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-gray-900 truncate">
                          {p.nombre_display || "—"}
                        </p>
                        {p.es_invitado && (
                          <Badge theme="yellow" size="sm">
                            invitado
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {p.email_display}
                      </p>
                      {orderMutation.isPending &&
                        orderMutation.variables?.pid === p.id && (
                          <span className="text-xs text-primary-600 ml-1">
                            guardando...
                          </span>
                        )}
                    </div>
                  </div>
                  {tanda.estado === "pendiente" && (
                    <button
                      onClick={() => removeParticipantMutation.mutate(p.id)}
                      className="p-1.5 rounded-lg text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Users className="w-6 h-6" />}
              title="Sin participantes"
              description="Agrega participantes para comenzar."
            />
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Rondas</h2>
          {rounds && rounds.length > 0 ? (
            <div className="space-y-2">
              {rounds.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100/60 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-semibold text-gray-900 shrink-0">
                        Ronda #{r.numero}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatMexicoDate(r.fecha_limite)}
                      </span>
                    </div>
                    <Badge
                      theme={
                        r.pagada
                          ? "green"
                          : r.estado === "cobrada"
                            ? "blue"
                            : "yellow"
                      }
                      size="sm"
                      dot
                    >
                      {r.pagada ? "Pagada" : capitalize(r.estado)}
                    </Badge>
                  </div>
                  <div className="mt-1.5 text-sm text-gray-500 flex items-center gap-1.5">
                    <span>Cobra:</span>
                    <span className="font-medium text-gray-700">
                      {r.cobrador_nombre || "—"}
                    </span>
                  </div>
                  {tanda.estado === "activa" && (
                    <div className="mt-2 flex items-center gap-2 pt-2 border-t border-gray-200/60">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/tandas/${id}/rondas/${r.id}`)
                        }
                      >
                        Ver pagos
                      </Button>
                      {r.estado === "cobrada" && !r.pagada && tanda.tipo_tanda !== "caja_ahorro" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<CheckCircle className="w-3.5 h-3.5" />}
                          onClick={() => pagarMutation.mutate(r.id)}
                          disabled={pagarMutation.isPending}
                          loading={
                            pagarMutation.isPending &&
                            pagarMutation.variables === r.id
                          }
                        >
                          Registrar como pagado Participante
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<PiggyBank className="w-6 h-6" />}
              title={tanda.estado === "pendiente" ? "Sin rondas" : "Sin rondas"}
              description={
                tanda.estado === "pendiente"
                  ? "Inicia la tanda para generar las rondas."
                  : undefined
              }
            />
          )}
        </Card>
      </div>

      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setSearchEmail("");
          setGuestName("");
          setGuestEmail("");
        }}
        title="Agregar Participante"
      >
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("buscar")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === "buscar"
                ? "bg-primary-100 text-primary-700 ring-1 ring-primary-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <UserCheck className="w-4 h-4" /> Usuario
          </button>
          <button
            onClick={() => setTab("invitado")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === "invitado"
                ? "bg-primary-100 text-primary-700 ring-1 ring-primary-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <UserIcon className="w-4 h-4" /> Invitado
          </button>
        </div>

        {tab === "buscar" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="input-base pl-9"
                autoFocus
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {searching && (
                <p className="text-sm text-gray-400 text-center py-4">
                  Buscando...
                </p>
              )}
              {!searching &&
                searchEmail.length >= 2 &&
                (searchResults || []).filter((u) => !participantIds.has(u.id))
                  .length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No se encontraron usuarios
                  </p>
                )}
              {!searching &&
                (searchResults || [])
                  .filter((u) => !participantIds.has(u.id))
                  .map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {u.nombre}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {u.email}
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAddRegistered(u.id)}
                        disabled={addParticipantMutation.isPending}
                      >
                        Agregar
                      </Button>
                    </div>
                  ))}
            </div>
          </div>
        )}

        {tab === "invitado" && (
          <form onSubmit={handleAddGuest} className="space-y-4">
            <Input
              label="Nombre"
              type="text"
              required
              placeholder="Nombre del invitado"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              autoFocus
            />
            <Input
              label="Email (opcional)"
              type="email"
              placeholder="correo@ejemplo.com"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
            />
            <Button
              type="submit"
              loading={addParticipantMutation.isPending}
              className="w-full"
              icon={<UserPlus className="w-4 h-4" />}
            >
              Agregar Invitado
            </Button>
          </form>
        )}

        {addParticipantMutation.isError && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
            {(addParticipantMutation.error as any)?.response?.data?.detail ||
              "Error al agregar"}
          </div>
        )}
      </Modal>
    </div>
  );
}
