/**
 * Módulo A — Autenticación y Control de Acceso.
 *
 * Registro con correo institucional (.edu.mx), verificación de cuenta,
 * inicio de sesión con JWT, sesión actual, recuperación de contraseña y
 * gestión de roles (solo Operaciones).
 */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ROLES } = require('../config/roles');
const {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  NODE_ENV,
  RESET_TOKEN_MINUTES,
} = require('../config/env');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require('../services/emailService');

// --- Helpers -------------------------------------------------------------

// Firma un JWT con el id del usuario.
const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

// Vista pública del usuario (nunca expone password ni tokens).
const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  area: u.area,
  program: u.program,
  isVerified: u.isVerified,
});

// Genera un token aleatorio y su hash (se guarda el hash, se envía el token).
const makeToken = () => {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
};

// --- Endpoints -----------------------------------------------------------

// POST /api/auth/register — registro con correo institucional + verificación.
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nombre, correo y contraseña son obligatorios.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: 'Ya existe una cuenta con ese correo.' });
    }

    const { raw, hash } = makeToken();
    const user = await User.create({
      name,
      email,
      password,
      verificationToken: hash,
      verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      // En desarrollo (sin SMTP) auto-verificamos para no bloquear el flujo.
      isVerified: NODE_ENV !== 'production',
    });

    await sendVerificationEmail(user.email, raw);

    // En desarrollo iniciamos sesión de una vez para una experiencia fluida.
    if (NODE_ENV !== 'production') {
      return res.status(201).json({
        token: signToken(user),
        user: publicUser(user),
        message: 'Cuenta creada y verificada (modo desarrollo).',
      });
    }

    return res.status(201).json({
      message: 'Cuenta creada. Revisa tu correo para verificarla.',
    });
  } catch (err) {
    // Errores de validación de Mongoose (ej. correo no institucional).
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors)[0]?.message || 'Datos inválidos.';
      return res.status(400).json({ message: msg });
    }
    next(err);
  }
};

// GET /api/auth/verify/:token — verifica el correo del usuario.
exports.verifyEmail = async (req, res, next) => {
  try {
    const hash = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      verificationToken: hash,
      verificationExpires: { $gt: new Date() },
    }).select('+verificationToken +verificationExpires');

    if (!user) {
      return res.status(400).json({ message: 'Enlace de verificación inválido o expirado.' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    return res.json({ message: 'Correo verificado. Ya puedes iniciar sesión.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login — valida credenciales (bcrypt) y emite JWT.
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Correo y contraseña son obligatorios.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Cuenta desactivada. Contacta a Operaciones.' });
    }
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Verifica tu correo antes de iniciar sesión.' });
    }

    return res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me — devuelve el usuario autenticado (req.user).
exports.me = async (req, res) => {
  return res.json(publicUser(req.user));
};

// POST /api/auth/forgot-password — genera token de un solo uso (30 min) y envía correo.
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });

    // Respuesta genérica para no revelar qué correos existen.
    const generic = { message: 'Si el correo existe, enviamos un enlace de recuperación.' };
    if (!user) return res.json(generic);

    const { raw, hash } = makeToken();
    user.resetPasswordToken = hash;
    user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000);
    await user.save();

    await sendPasswordResetEmail(user.email, raw);
    return res.json(generic);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/reset-password/:token — restablece la contraseña con el token.
exports.resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    const hash = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hash,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({ message: 'Enlace inválido o expirado.' });
    }

    user.password = password; // el hook pre-save vuelve a hashear.
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ message: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/auth/users/:id/role — cambia el rol de un usuario (solo Operaciones).
exports.updateRole = async (req, res, next) => {
  try {
    const { role, area, program } = req.body;
    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({ message: 'Rol no válido.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

    user.role = role;
    if (area !== undefined) user.area = area;
    if (program !== undefined) user.program = program;
    await user.save();

    return res.json(publicUser(user));
  } catch (err) {
    next(err);
  }
};
