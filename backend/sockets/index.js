const { Server } = require('socket.io');
const alertService = require('../services/alertService');

/**
 * Inicializa el gateway de Socket.io sobre el servidor HTTP.
 * Maneja salas por área para alertas dirigidas (geo/área).
 */
const initSockets = (httpServer, corsOrigin) => {
  const io = new Server(httpServer, { cors: { origin: corsOrigin } });

  // El alertService usa esta instancia para emitir alertas.
  alertService.init(io);

  io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado:', socket.id);

    // El cliente se suscribe a su área para recibir alertas dirigidas.
    socket.on('subscribe_area', (area) => {
      socket.join(`area:${area}`);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Cliente desconectado:', socket.id);
    });
  });

  return io;
};

module.exports = { initSockets };
