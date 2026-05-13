export interface User {
  id: string;
  email: string;
  nombre: string;
  telefono: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Tanda {
  id: string;
  nombre: string;
  descripcion: string | null;
  monto_periodo: number;
  tipo_periodo: 'semanal' | 'quincenal' | 'mensual';
  tipo_tanda: 'clasico' | 'caja_ahorro';
  numero_participantes: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  estado: 'pendiente' | 'activa' | 'completada' | 'cancelada';
  orden_sorteado: boolean;
  creador_id: string;
  created_at: string;
  participantes_count: number | null;
  rondas_count: number | null;
  num_rondas: number;
  advertencia: string | null;
}

export interface Participant {
  id: string;
  tanda_id: string;
  usuario_id: string | null;
  nombre_invitado: string | null;
  email_invitado: string | null;
  es_invitado: boolean;
  orden: number | null;
  fecha_ingreso: string;
  nombre_display: string | null;
  email_display: string | null;
}

export interface Round {
  id: string;
  tanda_id: string;
  numero: number;
  fecha_limite: string;
  cobrador_id: string | null;
  estado: 'pendiente' | 'cobrada' | 'saltada';
  pagada: boolean;
  cobrador_nombre: string | null;
}

export interface Payment {
  id: string;
  ronda_id: string;
  participante_id: string;
  monto: number;
  fecha_pago: string | null;
  estado: 'pendiente' | 'pagado' | 'atrasado';
  participante_nombre: string | null;
}

export interface ParticipantReport {
  participante_id: string;
  usuario_id: string;
  nombre_display: string | null;
  orden: number | null;
  pagos_hechos: number;
  monto_pagado: number;
  pagos_pendientes: number;
}

export interface RondaProgress {
  numero: number;
  cobrador: string;
  pagos_recibidos: number;
  total_participantes: number;
  porcentaje: number;
  estado: string;
}

export interface MontoMes {
  mes: string;
  label: string;
  monto: number;
}

export interface TandaReport {
  tanda_id: string;
  tanda_nombre: string;
  estado: string;
  monto_periodo: number;
  tipo_tanda: string;
  total_participantes: number;
  total_rondas: number;
  rondas_cobradas: number;
  total_pagos: number;
  pagos_completados: number;
  pagos_pendientes: number;
  monto_esperado: number;
  total_recaudado: number;
  porcentaje_completado: number;
  detalle_participantes: ParticipantReport[];
  rondas_data?: RondaProgress[];
  monto_acumulado_mes?: MontoMes[];
}