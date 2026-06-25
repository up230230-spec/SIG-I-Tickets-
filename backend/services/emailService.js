/**
 * Servicio de correo (Módulo A): verificación de cuenta y recuperación de contraseña.
 *
 * STUB: en producción usar nodemailer con la config SMTP de env.js.
 * Por ahora solo registra en consola para no bloquear el desarrollo.
 */

const sendVerificationEmail = async (to, token) => {
  // TODO: enviar correo real con enlace /api/auth/verify/:token
  console.log(`[emailService] Verificación → ${to} | token=${token}`);
};

const sendPasswordResetEmail = async (to, token) => {
  // TODO: enviar enlace de un solo uso (vigencia 30 min) /reset-password/:token
  console.log(`[emailService] Reset password → ${to} | token=${token}`);
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
