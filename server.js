require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const connectDB = require('./config/db');

// Importar rutas
const incidentRoutes = require('./routes/incidentRoutes');

// Inicializar Express y Conectar DB
const app = express();
app.use(cors());
// Nota: Si no tienes configurada la URL de Mongo en .env, esto fallará al conectar
connectDB(); // connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// RUTAS
app.use('/api/incidents', incidentRoutes);

// Crear Servidor HTTP para Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Lógica de WebSockets (Alertas y Geofencing)
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);
  
  socket.on('subscribe_zone', (zoneId) => {
    socket.join(zoneId);
    console.log(`Usuario ${socket.id} suscrito a zona ${zoneId}`);
  });
});

// Endpoint de prueba
app.get('/', (req, res) => {
  res.send('API Brigada SOS Online 🚑');
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));