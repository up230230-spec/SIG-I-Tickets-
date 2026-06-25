/**
 * Módulo A — Autenticación y Control de Acceso.
 *
 * STUB: define el contrato de cada endpoint. La lógica se implementará en Fase 2.
 * Todas las funciones responden 501 (Not Implemented) por ahora.
 */
const notImplemented = (name) => (req, res) =>
  res.status(501).json({ message: `TODO: implementar ${name}` });

// POST /api/auth/register — registro con correo institucional + envío de verificación.
exports.register = notImplemented('register');

// GET /api/auth/verify/:token — verifica el correo del usuario.
exports.verifyEmail = notImplemented('verifyEmail');

// POST /api/auth/login — valida credenciales (bcrypt) y emite JWT. Redirección por rol en el front.
exports.login = notImplemented('login');

// GET /api/auth/me — devuelve el usuario autenticado (req.user).
exports.me = notImplemented('me');

// POST /api/auth/forgot-password — genera token de un solo uso (vigencia 30 min) y envía correo.
exports.forgotPassword = notImplemented('forgotPassword');

// POST /api/auth/reset-password/:token — restablece la contraseña con el token.
exports.resetPassword = notImplemented('resetPassword');

// PATCH /api/auth/users/:id/role — cambia el rol de un usuario (solo Operaciones).
exports.updateRole = notImplemented('updateRole');
