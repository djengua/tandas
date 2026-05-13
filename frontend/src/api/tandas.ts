import api from './client';
import type { Tanda, Participant, Round, Payment, TandaReport } from '../types';

export const tandasApi = {
  list: () => api.get<Tanda[]>('/tandas').then((r) => r.data),

  get: (id: string) => api.get<Tanda>(`/tandas/${id}`).then((r) => r.data),

  create: (data: { nombre: string; descripcion?: string; monto_periodo: number; tipo_periodo: string; tipo_tanda: string; fecha_inicio: string; fecha_fin: string; num_rondas?: number }) =>
    api.post<Tanda>('/tandas', data).then((r) => r.data),

  update: (id: string, data: Partial<Tanda>) =>
    api.put<Tanda>(`/tandas/${id}`, data).then((r) => r.data),

  cancel: (id: string) =>
    api.delete(`/tandas/${id}`).then((r) => r.data),

  getParticipants: (id: string) =>
    api.get<Participant[]>(`/tandas/${id}/participantes`).then((r) => r.data),

  addParticipant: (tandaId: string, data: { usuario_id?: string; nombre_invitado?: string; email_invitado?: string }) =>
    api.post<Participant>(`/tandas/${tandaId}/participantes`, data).then((r) => r.data),

  removeParticipant: (tandaId: string, participantId: string) =>
    api.delete(`/tandas/${tandaId}/participantes/${participantId}`).then((r) => r.data),

  sortear: (tandaId: string) =>
    api.post(`/tandas/${tandaId}/sortear`).then((r) => r.data),

  iniciar: (tandaId: string) =>
    api.post(`/tandas/${tandaId}/iniciar`).then((r) => r.data),

  getRounds: (tandaId: string) =>
    api.get<Round[]>(`/tandas/${tandaId}/rondas`).then((r) => r.data),

  getRound: (tandaId: string, roundId: string) =>
    api.get<Round & { pagos: Payment[] }>(`/tandas/${tandaId}/rondas/${roundId}`).then((r) => r.data),

  registerPayment: (tandaId: string, roundId: string, participantId: string) =>
    api.post<Payment>(`/tandas/${tandaId}/rondas/${roundId}/pagos/${participantId}`).then((r) => r.data),

  cobrarRonda: (tandaId: string, roundId: string) =>
    api.post(`/tandas/${tandaId}/rondas/${roundId}/cobrar`).then((r) => r.data),

  pagarRonda: (tandaId: string, roundId: string) =>
    api.post<Round>(`/tandas/${tandaId}/rondas/${roundId}/pagar`).then((r) => r.data),

  getReport: (tandaId: string) =>
    api.get<TandaReport>(`/tandas/${tandaId}/reportes`).then((r) => r.data),

  exportReportCsv: async (tandaId: string) => {
    const response = await api.get(`/tandas/${tandaId}/reportes/exportar.csv`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_tanda_${tandaId}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  getReportActivities: (tandaId: string) =>
    api.get<any[]>(`/tandas/${tandaId}/reportes/actividades`).then((r) => r.data),

  updateParticipant: (tandaId: string, participantId: string, data: { orden?: number }) =>
    api.patch<Participant>(`/tandas/${tandaId}/participantes/${participantId}`, data).then((r) => r.data),
};
