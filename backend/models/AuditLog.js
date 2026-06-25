const mongoose = require('mongoose');

/**
 * Bitácora de auditoría de SOLO ESCRITURA (requisito de seguridad).
 * Retención mínima de 2 años. No debe exponerse ningún endpoint de
 * actualización/eliminación sobre esta colección.
 *
 * Registra acciones sensibles: login, cambios de estado, reasignaciones,
 * eliminación de tickets, cambios de rol, moderación de foro, etc.
 */
const AuditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, required: true }, // ej. 'ticket.status_change'
    entityType: { type: String, default: null }, // ej. 'Ticket'
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }, // detalles (from/to, ip, etc.)
    ip: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Bloquea cualquier intento de modificar registros existentes (append-only).
const blockMutation = function blockMutation(next) {
  next(new Error('AuditLog es de solo escritura: no se permiten modificaciones.'));
};
AuditLogSchema.pre('findOneAndUpdate', blockMutation);
AuditLogSchema.pre('updateOne', blockMutation);
AuditLogSchema.pre('updateMany', blockMutation);
AuditLogSchema.pre('deleteOne', blockMutation);
AuditLogSchema.pre('deleteMany', blockMutation);
AuditLogSchema.pre('findOneAndDelete', blockMutation);

module.exports = mongoose.model('AuditLog', AuditLogSchema);
