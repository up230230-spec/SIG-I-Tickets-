/**
 * Llamadas a la API de tickets (Módulos B/C).
 * Centraliza los endpoints para que las páginas no repitan rutas.
 */
import { api } from './client';

const qs = (params = {}) => {
  const clean = Object.entries(params).filter(([, v]) => v !== '' && v != null);
  return clean.length ? `?${new URLSearchParams(Object.fromEntries(clean))}` : '';
};

export const ticketsApi = {
  list: (filters) => api.get(`/tickets${qs(filters)}`),
  get: (id) => api.get(`/tickets/${id}`),
  create: (payload) => api.post('/tickets', payload),
  emergency: (payload) => api.post('/tickets/emergency', payload),
  updateStatus: (id, status, comment) => api.patch(`/tickets/${id}/status`, { status, comment }),
  reassign: (id, assignedTo, reason) => api.patch(`/tickets/${id}/reassign`, { assignedTo, reason }),
  addComment: (id, body, visibility) => api.post(`/tickets/${id}/comments`, { body, visibility }),
  remove: (id) => api.delete(`/tickets/${id}`),
};

// Etiquetas y estados para la UI.
export const STATUS_LABELS = {
  abierto: 'Abierto',
  en_proceso: 'En proceso',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
};

// Siguiente estado permitido en el flujo estándar (para el botón de avance).
export const NEXT_STATUS = {
  abierto: 'en_proceso',
  en_proceso: 'resuelto',
  resuelto: 'cerrado',
  cerrado: null,
};
