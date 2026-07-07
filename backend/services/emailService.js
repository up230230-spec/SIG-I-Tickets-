/**
 * Servicio de correo (Módulo A): verificación de cuenta y recuperación de contraseña.
 *
 * Sin SMTP configurado (ver .env), registra el enlace en consola para no
 * bloquear el desarrollo. Si defines SMTP_HOST/USER/PASS, aquí se integraría
 * nodemailer para el envío real.
 */
const { NODE_ENV, PORT } = require('../config/env');

const apiBase = `http://localhost:${PORT || 3000}`;

const sendVerificationEmail = async (to, token) => {
  const link = `${apiBase}/api/auth/verify/${token}`;
  console.log(`\n[emailService] Verificación de cuenta para ${to}`);
  console.log(`  → ${link}`);
  if (NODE_ENV !== 'production') {
    console.log('  (modo desarrollo: la cuenta ya quedó verificada automáticamente)\n');
  }
};

const sendPasswordResetEmail = async (to, token) => {
  // El token se usa desde el front (o vía POST /api/auth/reset-password/:token).
  console.log(`\n[emailService] Recuperación de contraseña para ${to}`);
  console.log(`  token de un solo uso (30 min): ${token}`);
  console.log(`  → POST ${apiBase}/api/auth/reset-password/${token}\n`);
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
