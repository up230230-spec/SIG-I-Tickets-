/**
 * Carga y valida las variables de entorno requeridas.
 * Falla rápido si falta alguna crítica para no arrancar mal configurado.
 */
require('dotenv').config();

const required = ['MONGO_URI', 'JWT_SECRET'];

const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`❌ Faltan variables de entorno: ${missing.join(', ')}`);
  console.error('   Copia backend/.env.example a backend/.env y complétalo.');
  process.exit(1);
}

module.exports = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || '*',
  // SMTP para verificación de correo y recuperación de contraseña (Módulo A).
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  // Reglas de negocio.
  ESCALATION_HOURS: Number(process.env.ESCALATION_HOURS || 48),
  RESET_TOKEN_MINUTES: Number(process.env.RESET_TOKEN_MINUTES || 30),
};
