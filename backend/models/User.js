const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/roles');

/**
 * Usuario de SIG-I. Cubre los 5 roles del sistema.
 * - Correo institucional con verificación (Módulo A).
 * - Password siempre en hash bcrypt (nunca texto plano).
 * - `area` aplica a admin_area; `program` aplica a jefe_carrera.
 */
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      // Solo correos institucionales.
      match: [/^[\w.+-]+@.*\.edu\.mx$/i, 'Debe ser un correo institucional (.edu.mx)'],
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USUARIO_GENERAL,
    },
    // Área asignada (para admin_area). Coincide con config/incidentCatalog AREAS.
    area: { type: String, default: null },
    // Programa académico (para jefe_carrera).
    program: { type: String, default: null },

    // Verificación de correo.
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, select: false },
    verificationExpires: { type: Date, select: false },

    // Recuperación de contraseña (enlace de un solo uso, vigencia 30 min).
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash automático del password antes de guardar.
UserSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compara un password en claro contra el hash almacenado.
UserSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', UserSchema);
