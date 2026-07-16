/**
 * Cliente de Socket.io para alertas en tiempo real (tickets críticos).
 *
 * Expone una única conexión compartida y helpers para suscribirse a la sala de
 * un área. El consumo desde React se hace a través del hook `useSocketAlerts`.
 */
import { io } from 'socket.io-client';

// La URL del socket es la de la API sin el sufijo /api.
const SOCKET_URL = (
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : `http://${window.location.hostname}:3000/api`)
).replace(/\/api\/?$/, '');

let socket = null;

// Devuelve la conexión (la crea la primera vez). Reutiliza una sola instancia.
export function connectSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket;
}

// Se une a la sala de un área para recibir solo sus alertas.
export function subscribeArea(area) {
  if (area) connectSocket().emit('subscribe_area', area);
}

// Cierra la conexión (p. ej. al cerrar sesión).
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
