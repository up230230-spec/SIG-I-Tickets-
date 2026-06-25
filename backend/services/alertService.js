/**
 * Servicio de alertas en tiempo real (Módulo B/D).
 *
 * Recibe la instancia de Socket.io (inyectada desde sockets/index.js) y emite
 * alertas masivas cuando se crea un ticket crítico/de emergencia (objetivo ≤10s).
 *
 * STUB: define la interfaz. La emisión real se conecta al crear tickets.
 */
let io = null;

const init = (socketServer) => {
  io = socketServer;
};

// Alerta masiva inmediata (tickets críticos / emergencia).
const broadcastCriticalAlert = (ticket) => {
  if (!io) return console.warn('[alertService] Socket.io no inicializado.');
  // TODO: emitir a salas relevantes (área responsable, operaciones).
  io.emit('critical_alert', {
    id: ticket._id,
    title: ticket.title,
    area: ticket.area,
    severity: ticket.severity,
    at: ticket.createdAt,
  });
};

// Notifica a la sala de un área un nuevo ticket / cambio.
const notifyArea = (area, event, payload) => {
  if (!io) return;
  io.to(`area:${area}`).emit(event, payload);
};

module.exports = { init, broadcastCriticalAlert, notifyArea };
