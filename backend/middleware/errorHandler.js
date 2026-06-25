const { NODE_ENV } = require('../config/env');

/** 404 para rutas no encontradas. */
const notFound = (req, res, next) => {
  res.status(404).json({ message: `Ruta no encontrada: ${req.originalUrl}` });
};

/** Manejador de errores global. Debe registrarse al final de la cadena. */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  console.error(`❌ ${err.message}`);
  res.status(status).json({
    message: err.message || 'Error interno del servidor',
    ...(NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};

module.exports = { notFound, errorHandler };
