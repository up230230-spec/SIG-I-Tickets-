/**
 * Cliente de Socket.io para alertas en tiempo real.
 * STUB: requiere `npm i socket.io-client`. Conecta y escucha alertas críticas.
 */
// import { io } from 'socket.io-client';

let socket = null;

export function connectSocket() {
  // TODO: const url = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
  // socket = io(url);
  // socket.on('critical_alert', (alert) => { ...mostrar notificación... });
  console.log('[socket] connectSocket — TODO implementar con socket.io-client');
  return socket;
}

export function subscribeArea(area) {
  // socket?.emit('subscribe_area', area);
}
