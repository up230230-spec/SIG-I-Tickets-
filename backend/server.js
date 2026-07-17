const env = require('./config/env'); // valida variables de entorno al cargar
const express = require('express');
const http = require('http');
const cors = require('cors');

const connectDB = require('./config/db');
const apiRoutes = require('./routes');
const { initSockets } = require('./sockets');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// --- Middleware base ---
app.use(cors({ origin: env.CLIENT_ORIGIN }));
// Límite ampliado: las fotos de los tickets viajan como data URL base64 en el JSON.
app.use(express.json({ limit: '8mb' }));

// --- Conexión a base de datos ---
connectDB();

// --- Rutas ---
app.get('/', (req, res) => res.send('SIG-I API Online ✅'));
app.use('/api', apiRoutes);

// --- Manejo de errores (al final) ---
app.use(notFound);
app.use(errorHandler);

// --- Servidor HTTP + Socket.io ---
const server = http.createServer(app);
initSockets(server, env.CLIENT_ORIGIN);

server.listen(env.PORT, () =>
  console.log(`🚀 SIG-I API corriendo en puerto ${env.PORT} (${env.NODE_ENV})`)
);

module.exports = { app, server };
